import { assertRequiredConfig, CFG } from './config.js';
import { logger } from './logger.js';
import { describeError } from './http.js';
import { listOneProductForDiagnostics } from './shipstation_v2.js';

try {
  assertRequiredConfig();
  const data = await listOneProductForDiagnostics();
  const products = Array.isArray(data?.products) ? data.products : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const first = products[0] || null;
  const output = {
    ok: true,
    baseUrl: CFG.shipstation.baseUrl,
    productsPath: CFG.shipstation.productsPath,
    topLevelKeys: data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [],
    productCountInResponse: products.length,
    firstProductKeys: first && typeof first === 'object' ? Object.keys(first) : [],
    firstProductSample: first
  };
  logger.info('ShipStation V2 auth/product list test succeeded', output);
  console.log(JSON.stringify(output, null, 2));
} catch (err) {
  const output = { ok: false, error: describeError(err) };
  logger.error('ShipStation V2 auth/product list test failed', output);
  console.log(JSON.stringify(output, null, 2));
  process.exit(1);
}
