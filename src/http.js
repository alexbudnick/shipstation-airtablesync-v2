export async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    err.url = url;
    throw err;
  }
  return body;
}

export function describeError(err) {
  return {
    message: err?.message || String(err),
    status: err?.status,
    url: err?.url,
    body: err?.body
  };
}
