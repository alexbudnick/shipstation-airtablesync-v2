# ShipStation Airtable Location Sync — V2 First

Purpose: keep ShipStation product/catalog locations in sync with Airtable.

It only syncs three things:

- SKU
- Name
- Location

It does not sync inventory, quantity, price, cost, orders, labels, or sold status.

## Main rule

Airtable is master.

- New Airtable SKU + Name creates a ShipStation product.
- Airtable Location updates ShipStation product location.
- If Location is blank, the app can either sync blank locations or skip them depending on `SYNC_BLANK_LOCATIONS`.

## Railway Start Command

For scheduled syncing, use:

```bash
npm run sync-locations
```

For a web health page/manual trigger server, use:

```bash
npm start
```

## Required Railway variables

```env
AIRTABLE_PAT=your_airtable_pat
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_TABLE_NAME=Inventory
AIRTABLE_SKU_FIELD=SKU
AIRTABLE_NAME_FIELD=Name
AIRTABLE_LOCATION_FIELD=Location

SHIPSTATION_V2_API_KEY=your_shipstation_v2_api_key
SHIPSTATION_V2_BASE_URL=https://api.shipstation.com/v2
```

## First safe test variables

```env
DRY_RUN=true
UPDATE_EXISTING_PRODUCTS=true
CREATE_MISSING_PRODUCTS=true
SYNC_BLANK_LOCATIONS=true
ONLY_SKUS=PUT_ONE_TEST_SKU_HERE
RUN_LIMIT=1
```

## Real run variables after test

```env
DRY_RUN=false
UPDATE_EXISTING_PRODUCTS=true
CREATE_MISSING_PRODUCTS=true
SYNC_BLANK_LOCATIONS=true
ONLY_SKUS=
RUN_LIMIT=
```

## Test V2 auth only

Run:

```bash
npm run test-v2
```

This calls ShipStation V2 `/products?page_size=1` and reports whether the key works and what field names the API returned.

## Important note

ShipStation V2 product docs have changed/expanded over time. This app is V2-first and has configurable field names/endpoints in case your account's product payload differs. If product creation is rejected by ShipStation, the Railway logs will show the exact status/body so we can adjust the payload.
