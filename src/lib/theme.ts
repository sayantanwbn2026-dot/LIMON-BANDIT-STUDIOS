/**
 * There is one theme, and it is dark.
 *
 * The site used to offer a bone theme behind a toggle in the nav, follow
 * the OS preference when nobody had chosen, and persist the choice in
 * localStorage. All of that is gone: a music house that looks like a
 * control room at two in the morning does not have a daytime variant, and
 * maintaining a second full palette — including a second set of contrast
 * measurements for every token — bought nothing it was worth.
 *
 * WHAT DID NOT GO: the `--alt-*` pole.
 * Those tokens are a design device, not the old light theme. A section
 * can choose to sit on the bone panel (Faq, the Journal index) and the
 * alt tokens are what it paints with. They invert against the theme
 * rather than being a theme of their own, so removing the preference
 * leaves them untouched.
 *
 * This module survives only to put the attribute on <html> before first
 * paint and to colour the browser chrome. It has no state, no listener
 * and nothing to read back, so there is no hook any more.
 */

export const SURFACE_DEEP = "#050505";

/**
 * Runs blocking in <head>. Now that the value is constant this could be a
 * static attribute in the markup — but the attribute is what every
 * `[data-theme="dark"]` token block keys off, and setting it here keeps
 * the stylesheet's contract with the document in one obvious place rather
 * than split between JSX and CSS.
 *
 * It also clears any preference an earlier visit stored, so a returning
 * visitor who once chose the bone theme is not left with a stale key in
 * their browser for a feature that no longer exists.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
document.documentElement.setAttribute("data-theme","dark");
var m=document.querySelector('meta[name="theme-color"]');
if(m)m.setAttribute("content",${JSON.stringify(SURFACE_DEEP)});
localStorage.removeItem("lb-theme");
}catch(e){}})();`;
