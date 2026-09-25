# Esthemax Singapore — Website

Static website for Esthemax Singapore. No build step and no server-side code: every page is
plain HTML, CSS and JavaScript, so it can be hosted on GitHub Pages, Netlify, Vercel, or any
standard web host by uploading the files as they are.

## Running it locally

From this folder:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173

(Opening the HTML files directly with `file://` will not work properly, because the product
and blog data are loaded as scripts. Use the local server above.)

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home. Video hero, Hydrojelly collection strip, category grid, why-us, FAQ, contact |
| `shop.html` | Collection landing. Video hero and the five product categories |
| `hydrojelly-collection.html` | All 38 Hydrojelly masks, filterable, plus sets and samples |
| `serums.html` | Serums |
| `innovation-creams.html` | Innovation creams |
| `cleansers.html` | Cleansers, enzyme powder, toner |
| `massage-body.html` | Massage creams, body and sun |
| `product.html` | Individual product page, driven by `?id=` (e.g. `product.html?id=805`) |
| `beauty-resource.html` | Blog: articles, YouTube videos and downloadable PDF catalogs |
| `about.html` | About |
| `contact.html` | Contact form, details and map |
| `cms.html` | Admin tool for writing Beauty Resource posts (see below) |

## Editing content

### Products
All product content lives in **`assets/data/catalog.js`** — one file containing the 38
Hydrojelly masks, the sets, and the 14 skincare products, each with its description,
skin concerns, size and full ingredient list. Every product page and grid reads from it,
so editing a description there updates it everywhere.

### Blog posts (Beauty Resource)
Posts live in **`assets/data/posts.js`**. To publish without touching code:

1. Open `cms.html` in a browser.
2. Write or edit a post. It saves in that browser immediately, so "Preview Site" shows it.
3. Press **Publish — Download posts.js**.
4. Replace `assets/data/posts.js` with the downloaded file and upload it. The post is now
   live for everyone.

**PDFs:** put the file in `assets/pdfs/`, then enter its path (e.g. `assets/pdfs/catalog.pdf`)
in the CMS. Visitors get a download button and an inline preview.
**Videos:** paste any YouTube link and it embeds automatically.

### Colours and styling
Site-wide colours and shared components live in **`assets/theme.css`**, which loads after each
page's own styles and overrides them. Change the palette there once and it applies everywhere.

Note: the pages link to it with a version query (`theme.css?v=8`). After editing the theme,
increase that number in the HTML files so browsers pick up the new version instead of a
cached copy.

## Structure

```
assets/
  banners/     hero images and videos
  products/
    us/        Hydrojelly mask jars (named by product code)
    skincare/  skincare product photos
  pdfs/        downloadable catalogs
  data/
    catalog.js all product content
    posts.js   blog posts
  theme.css    site-wide colours and shared components
  reveal.css   scroll fade-in styles
  reveal.js    scroll fade-in behaviour
```

## Contact

Esthemax Singapore
2 Jurong East Street 21, #04-13A IMM Building, Singapore 609601
(+65) 9693 8980 · enquiry@esthemax.com.sg
