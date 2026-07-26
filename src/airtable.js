import { CFG } from './config.js';
import { requestJson } from './http.js';

function airtableUrl(path, params = {}) {
  const url = new URL(`https://api.airtable.com/v0/${CFG.airtableBaseId}/${encodeURIComponent(CFG.airtableTableName)}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  return url.toString();
}

function headers() {
  return {
    Authorization: `Bearer ${CFG.airtablePat}`,
    'Content-Type': 'application/json'
  };
}

function airtableFormula() {
  const skuField = CFG.fields.sku.replace(/'/g, "\\'");
  const nameField = CFG.fields.name.replace(/'/g, "\\'");
  return `AND({${skuField}}!='',{${nameField}}!='')`;
}

export async function fetchAirtableRecords() {
  const records = [];
  let offset;
  do {
    const params = {
      pageSize: '100',
      filterByFormula: airtableFormula()
    };
    if (CFG.airtableViewName) params.view = CFG.airtableViewName;
    if (offset) params.offset = offset;
    const data = await requestJson(airtableUrl('', params), { headers: headers() });
    for (const rec of data.records || []) {
      const f = rec.fields || {};
      const sku = String(f[CFG.fields.sku] || '').trim();
      const name = String(f[CFG.fields.name] || '').trim();
      const location = String(f[CFG.fields.location] || '').trim();
      if (!sku || !name) continue;
      if (CFG.onlySkus.length && !CFG.onlySkus.includes(sku)) continue;
      if (!CFG.syncBlankLocations && !location) continue;
      records.push({ airtableId: rec.id, sku, name, location });
      if (CFG.runLimit && records.length >= CFG.runLimit) return records;
    }
    offset = data.offset;
  } while (offset);
  return records;
}
