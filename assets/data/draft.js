/* Lets the CMS preview unpublished work.
   If this browser has a working draft saved by cms.html, use it instead of the
   published catalog. Visitors who have never opened the CMS are unaffected,
   since nothing is stored for them. Loaded immediately after catalog.js. */
(function () {
  try {
    var draft = JSON.parse(localStorage.getItem('em_catalog'));
    if (draft && Array.isArray(draft.masks) && draft.masks.length) {
      window.EM = {
        masks: draft.masks,
        sets: draft.sets || (window.EM && window.EM.sets) || [],
        skincare: draft.skincare || (window.EM && window.EM.skincare) || [],
        contact: draft.contact || (window.EM && window.EM.contact)
      };
    }
  } catch (e) { /* keep the published catalog */ }
})();
