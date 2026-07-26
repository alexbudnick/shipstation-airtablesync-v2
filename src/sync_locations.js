import { CFG, assertRequiredConfig } from './config.js';
import { logger } from './logger.js';
import { describeError } from './http.js';
import { fetchAirtableRecords } from './airtable.js';
import {
  listProductsBySku,
  createProduct,
  updateProduct,
  productLocation,
  productName,
  productId
} from './shipstation_v2.js';

function needsUpdate(product, record) {
  const currentLocation = String(productLocation(product) || '').trim();
  const currentName = String(productName(product) || '').trim();
  return currentLocation !== record.location || currentName !== record.name;
}

async function processRecord(record) {
  const found = await listProductsBySku(record.sku);

  if (found.length > 1) {
    return {
      sku: record.sku,
      name: record.name,
      location: record.location,
      action: 'skipped_duplicate_shipstation_sku',
      count: found.length,
      productIds: found.map(productId).filter(Boolean)
    };
  }

  if (found.length === 1) {
    const product = found[0];
    const beforeLocation = String(productLocation(product) || '').trim();
    const beforeName = String(productName(product) || '').trim();

    if (!needsUpdate(product, record)) {
      return {
        sku: record.sku,
        name: record.name,
        location: record.location,
        action: 'already_correct',
        productId: productId(product),
        beforeLocation,
        beforeName
      };
    }

    if (!CFG.updateExisting) {
      return {
        sku: record.sku,
        name: record.name,
        location: record.location,
        action: 'skipped_update_existing_disabled',
        productId: productId(product),
        beforeLocation,
        beforeName
      };
    }

    if (CFG.dryRun) {
      return {
        sku: record.sku,
        name: record.name,
        location: record.location,
        action: 'dry_run_would_update_existing',
        productId: productId(product),
        beforeLocation,
        beforeName
      };
    }

    await updateProduct(product, record);
    return {
      sku: record.sku,
      name: record.name,
      location: record.location,
      action: 'updated_existing',
      productId: productId(product),
      beforeLocation,
      afterLocation: record.location,
      beforeName,
      afterName: record.name
    };
  }

  if (!CFG.createMissing) {
    return {
      sku: record.sku,
      name: record.name,
      location: record.location,
      action: 'missing_product_create_disabled'
    };
  }

  if (CFG.dryRun) {
    return {
      sku: record.sku,
      name: record.name,
      location: record.location,
      action: 'dry_run_would_create_missing'
    };
  }

  const created = await createProduct(record);
  return {
    sku: record.sku,
    name: record.name,
    location: record.location,
    action: 'created_missing',
    productId: productId(created) || created?.product_id || created?.id || null,
    rawCreateKeys: created && typeof created === 'object' ? Object.keys(created).slice(0, 20) : []
  };
}

export async function main() {
  assertRequiredConfig();
  logger.info('Starting ShipStation Airtable Location Sync - V2 first', {
    dryRun: CFG.dryRun,
    updateExisting: CFG.updateExisting,
    createMissing: CFG.createMissing,
    syncBlankLocations: CFG.syncBlankLocations,
    onlySkus: CFG.onlySkus,
    runLimit: CFG.runLimit,
    shipstationBaseUrl: CFG.shipstation.baseUrl,
    productsPath: CFG.shipstation.productsPath
  });

  const airtableRecords = await fetchAirtableRecords();
  logger.info('Loaded Airtable records', { count: airtableRecords.length });

  const results = [];
  for (const record of airtableRecords) {
    try {
      logger.info('Checking SKU', record);
      const result = await processRecord(record);
      results.push(result);
      logger.info('SKU result', result);
    } catch (err) {
      const result = {
        sku: record.sku,
        name: record.name,
        location: record.location,
        action: 'failed',
        error: describeError(err)
      };
      results.push(result);
      logger.error('SKU failed', result);
    }
  }

  const summary = results.reduce((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1;
    return acc;
  }, {});

  const output = {
    ok: results.every(r => r.action !== 'failed'),
    scannedAirtableRecords: airtableRecords.length,
    summary,
    results
  };

  logger.info('Finished sync', output);
  console.log(JSON.stringify(output, null, 2));

  if (!output.ok) process.exitCode = 1;
  return output;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    logger.error('Fatal sync error', describeError(err));
    process.exit(1);
  });
}
