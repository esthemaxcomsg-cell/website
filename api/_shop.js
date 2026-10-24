/* Shared helpers for the private shop. Runs on Vercel only.
   The Stripe key comes from the STRIPE_SECRET_KEY environment variable set in Vercel
   (Project > Settings > Environment Variables). It is never sent to the browser. */

// Which Stripe products appear in the shop: active, priced in SGD, name contains "Hydrojelly".
// Products named like quote/invoice codes (e.g. "Q1010") are always left out.
const MATCH = /hydrojelly/i;
const EXCLUDE = /^Q\d+$/i;
const CURRENCY = 'sgd';

function inShop(product, price) {
  if (!product || !price) return false;
  if (!product.active || !price.active) return false;
  if (EXCLUDE.test((product.name || '').trim())) return false;
  if (!MATCH.test(product.name || '')) return false;
  if ((price.currency || '').toLowerCase() !== CURRENCY) return false;
  if (price.type && price.type !== 'one_time') return false;
  return typeof price.unit_amount === 'number' && price.unit_amount > 0;
}

async function stripe(path, { method = 'GET', params } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error('Shop is not connected to Stripe yet.'), { status: 503 });
  const body = params ? new URLSearchParams(params).toString() : undefined;
  const url = 'https://api.stripe.com/v1/' + path + (method === 'GET' && body ? (path.includes('?') ? '&' : '?') + body : '');
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error((json.error && json.error.message) || 'Stripe error'), { status: 502 });
  return json;
}

module.exports = { inShop, stripe };
