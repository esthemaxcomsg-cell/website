/* Shared helpers for the private shop. Runs on Vercel only.
   The Stripe key comes from the STRIPE_SECRET_KEY environment variable set in Vercel
   (Project > Settings > Environment Variables). It is never sent to the browser. */

// Which Stripe products appear in the shop. Only these, plus any product given the
// metadata  shop = yes  in the Stripe dashboard (Product > Metadata), so new items can be
// added from Stripe without touching code. Must be active, one-time, priced in SGD.
const SHOP_PRODUCTS = [
  'prod_VUVnpadQTCwGZQ', // ESTHEMAX Calendula Floral Hydrojelly mask
  'prod_VUVrOdt4dQG3LT', // ESTHEMAX Illuminating Orange Hydrojelly Mask
  'prod_VUVptYJwcgVcAP', // ESTHEMAX Intensive Aftercare Hydrojelly Mask
  'prod_VUW51Trgg7DVDr', // ESTHEMAX Skin Warrior Ageless Hydrojelly Mask
  'prod_VUW4AFgwpcA6o2'  // Pure Himalayan White Tea Hydrojelly Mask
];
const EXCLUDE = /^Q\d+$/i;   // quote and invoice items (e.g. Q1010) never appear
const CURRENCY = 'sgd';

function inShop(product, price) {
  if (!product || !price) return false;
  if (!product.active || !price.active) return false;
  if (EXCLUDE.test((product.name || '').trim())) return false;
  const tagged = product.metadata && String(product.metadata.shop || '').toLowerCase() === 'yes';
  if (!SHOP_PRODUCTS.includes(product.id) && !tagged) return false;
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
