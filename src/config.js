import 'dotenv/config';

function clean(value, fallback = '') {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function bool(name, fallback = false) {
  const value = clean(process.env[name]);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

function intValue(name, fallback = null) {
  const value = clean(process.env[name]);
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const CFG = {
  airtablePat: clean(process.env.AIRTABLE_PAT),
  airtableBaseId: clean(process.env.AIRTABLE_BASE_ID),
  airtableTableName: clean(process.env.AIRTABLE_TABLE_NAME, 'Inventory'),
  airtableViewName: clean(process.env.AIRTABLE_VIEW_NAME),
  fields: {
    sku: clean(process.env.AIRTABLE_SKU_FIELD, 'SKU'),
    name: clean(process.env.AIRTABLE_NAME_FIELD, 'Name'),
    location: clean(process.env.AIRTABLE_LOCATION_FIELD, 'Location')
  },
  shipstation: {
    apiKey: clean(process.env.SHIPSTATION_V2_API_KEY),
    baseUrl: clean(process.env.SHIPSTATION_V2_BASE_URL, 'https://api.shipstation.com/v2').replace(/\/$/, ''),
    productsPath: clean(process.env.SHIPSTATION_PRODUCTS_PATH, '/products'),
    lookupQuery: clean(process.env.SHIPSTATION_PRODUCT_LOOKUP_QUERY, 'sku'),
    idField: clean(process.env.SHIPSTATION_PRODUCT_ID_FIELD, 'product_id'),
    skuField: clean(process.env.SHIPSTATION_PRODUCT_SKU_FIELD, 'sku'),
    nameField: clean(process.env.SHIPSTATION_PRODUCT_NAME_FIELD, 'name'),
    locationField: clean(process.env.SHIPSTATION_PRODUCT_LOCATION_FIELD, 'warehouse_location')
  },
  dryRun: bool('DRY_RUN', true),
  updateExisting: bool('UPDATE_EXISTING_PRODUCTS', true),
  createMissing: bool('CREATE_MISSING_PRODUCTS', false),
  syncBlankLocations: bool('SYNC_BLANK_LOCATIONS', true),
  onlySkus: clean(process.env.ONLY_SKUS)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  runLimit: intValue('RUN_LIMIT', null),
  port: intValue('PORT', 8080),
  jobSecret: clean(process.env.JOB_SECRET)
};

export function assertRequiredConfig() {
  const missing = [];
  if (!CFG.airtablePat) missing.push('AIRTABLE_PAT');
  if (!CFG.airtableBaseId) missing.push('AIRTABLE_BASE_ID');
  if (!CFG.airtableTableName) missing.push('AIRTABLE_TABLE_NAME');
  if (!CFG.shipstation.apiKey) missing.push('SHIPSTATION_V2_API_KEY');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
