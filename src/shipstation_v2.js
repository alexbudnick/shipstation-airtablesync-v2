import { CFG } from './config.js';
import { requestJson } from './http.js';

function ssUrl(path, params = {}) {
  const basePath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${CFG.shipstation.baseUrl}${basePath}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  return url.toString();
}

function headers() {
  return {
    'api-key': CFG.shipstation.apiKey,
    'API-Key': CFG.shipstation.apiKey,
    'Content-Type': 'application/json'
  };
}

function productsArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function productId(product) {
  return product?.[CFG.shipstation.idField] || product?.product_id || product?.productId || product?.id;
}

export function productSku(product) {
  return product?.[CFG.shipstation.skuField] || product?.sku || product?.SKU;
}

export function productName(product) {
  return product?.[CFG.shipstation.nameField] || product?.name || product?.description || '';
}

export function productLocation(product) {
  return product?.[CFG.shipstation.locationField]
    ?? product?.warehouse_location
    ?? product?.warehouseLocation
    ?? product?.location
    ?? '';
}

function productPayload(record) {
  // Include both common snake_case and camelCase location keys. ShipStation will ignore or reject unknown keys depending on endpoint behavior.
  // If rejected, set SHIPSTATION_PRODUCT_LOCATION_FIELD to the exact field name from the docs/account response and we can trim this payload.
  return {
    sku: record.sku,
    name: record.name,
    warehouse_location: record.location || '',
    warehouseLocation: record.location || '',
    active: true
  };
}

export async function listProductsBySku(sku) {
  const params = {
    [CFG.shipstation.lookupQuery]: sku,
    page_size: '25'
  };
  const data = await requestJson(ssUrl(CFG.shipstation.productsPath, params), {
    method: 'GET',
    headers: headers()
  });
  const items = productsArray(data);
  return items.filter(p => String(productSku(p) || '').trim().toLowerCase() === sku.toLowerCase());
}

export async function listOneProductForDiagnostics() {
  const data = await requestJson(ssUrl(CFG.shipstation.productsPath, { page_size: '1' }), {
    method: 'GET',
    headers: headers()
  });
  return data;
}

export async function createProduct(record) {
  return requestJson(ssUrl(CFG.shipstation.productsPath), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(productPayload(record))
  });
}

export async function updateProduct(product, record) {
  const id = productId(product);
  if (!id) throw new Error('ShipStation product has no usable product id field. Check product response field names.');
  const path = `${CFG.shipstation.productsPath.replace(/\/$/, '')}/${encodeURIComponent(id)}`;
  return requestJson(ssUrl(path), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(productPayload(record))
  });
}
