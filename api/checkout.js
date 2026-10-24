/* POST /api/checkout  { items: [{ price: "price_...", quantity: 2 }, ...] }
   -> { url } of a Stripe Checkout page. Every price is re-checked with Stripe here,
   so the browser cannot change what is charged or add products outside the shop. */
const { inShop, stripe } = require('./_shop');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST' }); }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length || items.length > 50) return res.status(400).json({ error: 'Your cart is empty.' });

    const merged = new Map();
    for (const it of items) {
      const id = String(it && it.price || '');
      const qty = Math.floor(Number(it && it.quantity));
      if (!/^price_[A-Za-z0-9]+$/.test(id) || !(qty >= 1 && qty <= 99)) return res.status(400).json({ error: 'Something in your cart is not valid.' });
      merged.set(id, Math.min(99, (merged.get(id) || 0) + qty));
    }

    const params = {
      mode: 'payment',
      success_url: origin(req) + '/shops/thanks.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin(req) + '/shops/',
      'shipping_address_collection[allowed_countries][0]': 'SG',
      'phone_number_collection[enabled]': 'true',
      'billing_address_collection': 'auto'
    };
    let i = 0;
    for (const [id, qty] of merged) {
      const price = await stripe('prices/' + encodeURIComponent(id), { params: { 'expand[]': 'product' } });
      if (!inShop(price.product, price)) return res.status(400).json({ error: 'One of the items is no longer available.' });
      params['line_items[' + i + '][price]'] = id;
      params['line_items[' + i + '][quantity]'] = String(qty);
      i++;
    }

    const session = await stripe('checkout/sessions', { method: 'POST', params });
    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

function origin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host;
}
