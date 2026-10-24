/* Private shop: products from Stripe (via /api/products), a cart kept in this browser,
   and checkout through Stripe. Shared by /shops/ and /shops/product.html. */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = c => 'S$' + (c / 100).toFixed(2);
  let PRODUCTS = [];
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('em_cart')) || {}; } catch (e) { cart = {}; }
  const save = () => { try { localStorage.setItem('em_cart', JSON.stringify(cart)); } catch (e) {} };

  // the cart drawer is the same on every shop page, so it is built here
  document.body.insertAdjacentHTML('beforeend', `
    <div class="scrim" id="scrim"></div>
    <aside class="drawer" id="drawer" aria-label="Your cart">
      <div class="d-head"><h2>Your cart</h2><button class="x" id="closeCart" aria-label="Close cart">&times;</button></div>
      <div class="d-list" id="lines"></div>
      <div class="d-foot">
        <div class="sub"><span>Subtotal</span><b id="subtotal">S$0.00</b></div>
        <p class="fine">Delivery address and payment are taken on the next page.</p>
        <button class="go" id="checkout">Checkout</button>
        <div class="err" id="err"></div>
        <div class="secure"><svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Secure checkout by Stripe</div>
      </div>
    </aside>`);

  const open = () => document.body.classList.add('cart-open');
  const close = () => document.body.classList.remove('cart-open');
  $('#closeCart').onclick = close; $('#scrim').onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.querySelectorAll('[data-open-cart]').forEach(b => b.onclick = open);

  function add(price, qty) { cart[price] = Math.min(99, (cart[price] || 0) + (qty || 1)); save(); renderCart(); }

  function renderCart() {
    const find = id => PRODUCTS.find(p => p.price === id);
    const ids = Object.keys(cart).filter(find);
    const count = ids.reduce((s, id) => s + cart[id], 0);
    const total = ids.reduce((s, id) => s + cart[id] * find(id).amount, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count);
    $('#subtotal').textContent = money(total);
    $('#checkout').disabled = !count;
    $('#lines').innerHTML = ids.length ? ids.map(id => {
      const p = find(id);
      return `<div class="line">
        ${p.image ? `<img src="${esc(p.image)}" alt="">` : '<span></span>'}
        <div><h4>${esc(p.name)}</h4><div class="qty"><button data-d="-1" data-id="${esc(id)}" aria-label="Less">&minus;</button><span>${cart[id]}</span><button data-d="1" data-id="${esc(id)}" aria-label="More">+</button></div></div>
        <div class="amt">${money(p.amount * cart[id])}<button class="rm" data-id="${esc(id)}">Remove</button></div>
      </div>`;
    }).join('') : '<p class="empty">Your cart is empty.</p>';
    $('#lines').querySelectorAll('.qty button').forEach(b => b.onclick = () => {
      const id = b.dataset.id; cart[id] = (cart[id] || 0) + Number(b.dataset.d);
      if (cart[id] <= 0) delete cart[id]; if (cart[id] > 99) cart[id] = 99; save(); renderCart();
    });
    $('#lines').querySelectorAll('.rm').forEach(b => b.onclick = () => { delete cart[b.dataset.id]; save(); renderCart(); });
  }

  async function checkout(items, btn, errEl) {
    const label = btn.textContent; errEl.textContent = '';
    btn.disabled = true; btn.textContent = 'Opening secure checkout...';
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is not available right now.');
      location.href = data.url;
    } catch (e) { errEl.textContent = e.message; btn.disabled = false; btn.textContent = label; }
  }
  $('#checkout').onclick = () => checkout(Object.keys(cart).map(id => ({ price: id, quantity: cart[id] })), $('#checkout'), $('#err'));

  function load() {
    return fetch('/api/products').then(r => r.ok ? r.json() : Promise.reject(r)).then(d => {
      PRODUCTS = d.products || [];
      Object.keys(cart).forEach(id => { if (!PRODUCTS.find(p => p.price === id)) delete cart[id]; });   // drop items no longer sold
      save(); renderCart();
      return PRODUCTS;
    });
  }

  window.Shop = { load, add, open, renderCart, checkout, money, esc, products: () => PRODUCTS };
  renderCart();
})();
