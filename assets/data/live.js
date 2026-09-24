/* Loads the published content from Supabase and swaps it in for the files
   shipped with the site (catalog.js / posts.js), which stay as a fallback.
   Runs before each page's own script so the page simply renders live data.
   A copy is kept in this browser so later pages open instantly; it is refreshed
   in the background and used only while it is fresh. */
(function () {
  var cfg = window.EM_SB; if (!cfg) return;
  var KEY = 'em_live', FRESH = 5 * 60 * 1000;
  var url = cfg.url + '/rest/v1/content?select=kind,id,ord,data&order=ord.asc,id.asc';
  var headers = { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key };

  function apply(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;
    var by = {};
    rows.forEach(function (r) { (by[r.kind] = by[r.kind] || []).push(r.data); });
    var old = window.EM || {};
    window.EM = {
      masks: by.mask || [], sets: by.set || [], skincare: by.skincare || [],
      contact: (by.contact && by.contact[0]) || old.contact || null
    };
    window.EM_POSTS = by.post || [];
    return true;
  }
  function save(rows) { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), rows: rows })); } catch (e) {} }

  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var fresh = cached && cached.rows && Date.now() - cached.t < FRESH;

  if (fresh) {
    apply(cached.rows);
  } else {
    /* first visit (or stale copy): fetch before the page draws, so it never shows old content */
    var got = false;
    try {
      var x = new XMLHttpRequest();
      x.open('GET', url, false);
      x.setRequestHeader('apikey', cfg.key); x.setRequestHeader('Authorization', 'Bearer ' + cfg.key);
      x.send(null);
      if (x.status === 200) { var rows = JSON.parse(x.responseText); if (apply(rows)) { save(rows); got = true; } }
    } catch (e) {}
    if (!got && cached && cached.rows) apply(cached.rows);
  }

  /* keep the copy current for the next page */
  if (window.fetch) fetch(url, { headers: headers }).then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) { if (Array.isArray(rows) && rows.length) save(rows); }).catch(function () {});
})();
