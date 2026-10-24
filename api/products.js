/* GET /api/products -> the products the shop sells, straight from the Stripe catalog. */
const { inShop, stripe } = require('./_shop');

// house style: no registered-trademark marks or long dashes in shop text
const tidy = s => String(s).replace(/\s*[\u00ae]/g, '').replace(/\s+[\u2014\u2013]\s+/g, ', ').replace(/\s+/g, ' ').trim();

module.exports = async (req, res) => {
  try {
    const out = [];
    let after = null;
    for (let page = 0; page < 10; page++) {
      const params = { active: 'true', limit: '100', 'expand[]': 'data.default_price' };
      if (after) params.starting_after = after;
      const list = await stripe('products', { params });
      for (const p of list.data) {
        const price = p.default_price;
        if (!inShop(p, price)) continue;
        out.push({
          id: p.id,
          name: tidy(p.name),
          description: tidy(p.description || ''),
          image: (p.images && p.images[0]) || '',
          images: p.images || [],
          price: price.id,
          amount: price.unit_amount,
          currency: price.currency
        });
      }
      if (!list.has_more || !list.data.length) break;
      after = list.data[list.data.length - 1].id;
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json({ products: out });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
