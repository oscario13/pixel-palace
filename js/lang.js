/*
  The game's two languages, English and Traditional Chinese. Everything the
  player reads goes through L(en, zh), so both versions of a line sit side by
  side in the code and can't drift apart. No DOM, so tests can use it.
*/
(function (root) {
  const LANGS = ["en", "zh"];
  let current = "en";
  const listeners = [];

  function set(lang) {
    if (!LANGS.includes(lang) || lang === current) return;
    current = lang;
    for (const fn of listeners) fn(lang);
  }

  const get = () => current;
  const isZh = () => current === "zh";
  const L = (en, zh) => (current === "zh" && zh != null ? zh : en);

  function onChange(fn) { listeners.push(fn); }

  // A first-time visitor gets the language their browser lists first.
  function preferred(nav) {
    const list = (nav && (nav.languages && nav.languages.length ? nav.languages : [nav.language])) || [];
    return /^zh/i.test(list[0] || "") ? "zh" : "en";
  }

  const api = { LANGS, set, get, isZh, L, onChange, preferred };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Lang = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
