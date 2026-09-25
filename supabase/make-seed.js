// Rebuilds supabase/setup.sql from the shipped catalog and posts. Run: node supabase/make-seed.js
const fs = require('fs'), path = require('path');
global.window = {};
require(path.join(__dirname, '../assets/data/catalog.js')); require(path.join(__dirname, '../assets/data/posts.js'));
const E = window.EM, P = window.EM_POSTS;
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const rows = [];
E.masks.forEach((m, i) => rows.push(['mask', m.code, i, m]));
E.skincare.forEach((m, i) => rows.push(['skincare', m.slug, i, m]));
E.sets.forEach((m, i) => rows.push(['set', m.code, i, m]));
P.forEach((m, i) => rows.push(['post', m.id, i, m]));
rows.push(['contact', 'contact', 0, E.contact]);
const values = rows.map(([k, id, o, d]) => `(${q(k)}, ${q(id)}, ${o}, ${q(JSON.stringify(d))}::jsonb)`).join(',\n');
const head = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8').split('-- 4. Today')[0];
fs.writeFileSync(path.join(__dirname, 'setup.sql'), head + `-- 4. Today's products and posts, so nothing is lost.
insert into public.content (kind, id, ord, data) values
${values}
on conflict (kind, id) do update set data = excluded.data, ord = excluded.ord, updated_at = now();
`);
console.log('setup.sql rebuilt with', rows.length, 'rows');
