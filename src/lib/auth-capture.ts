/**
 * Catch the session a sign-in email hands back, before anything can drop it.
 *
 * THE BUG THIS EXISTS FOR. Supabase's magic link finishes at
 * `GET /auth/v1/verify`, which answers 303 and sends the browser to the app
 * with the session in the URL — the implicit flow puts it in the hash
 * (`#access_token=…&refresh_token=…`), confirmed in this project's own auth
 * logs: `"login_method":"implicit"`, status 303, login recorded against the
 * user. The server side worked perfectly. The browser then threw it away.
 *
 * Two things conspired. The router normalises the URL during hydration —
 * measured here, `/?confirmed=1#access_token=…` was reduced to `/` with hash
 * AND query gone before the first timer fired. And `supabase-js` is a
 * DYNAMIC import, deliberately, to keep ~100KB out of the entry chunk, so the
 * client whose `detectSessionInUrl` would have read those tokens does not
 * exist until a chunk has been fetched. The tokens were destroyed before
 * their reader loaded. `detectSessionInUrl: true` was set and could never
 * have fired; it was racing something that always won.
 *
 * So the capture has to happen in the one place that runs before React, the
 * router and every module: a blocking inline script in <head>. It copies the
 * tokens into sessionStorage and strips them from the address bar. Whatever
 * mangles the URL afterwards is then mangling a URL with nothing in it.
 *
 * WHY sessionStorage. It survives the hydration the tokens did not, it is
 * per-tab so a second tab cannot pick up a session meant for this one, and it
 * dies with the tab if anything goes wrong before the handover. The value is
 * read exactly once and deleted on read, so a refresh cannot replay it.
 *
 * This is not a second source of truth for the session: it is a doorway. Once
 * `setSession` has it, supabase-js owns it as it always did.
 */

export const AUTH_CAPTURE_KEY = "lb-auth-handoff";

/**
 * Runs blocking in <head>, before the router exists.
 *
 * Handles both flows because the project may move between them: implicit
 * leaves `access_token` in the hash, PKCE leaves `code` in the query. Also
 * carries `error_description` through — a link that has expired or been used
 * twice comes back as an error in exactly the same place, and silently
 * swallowing that is how "nothing happened" becomes unexplainable.
 *
 * Everything is wrapped: a blocking script in <head> that throws would stop
 * the page rendering at all, and no sign-in is worth a blank site.
 */
export const AUTH_CAPTURE_SCRIPT = `(function(){try{
var h=location.hash||"",q=location.search||"";
var hp=new URLSearchParams(h.replace(/^#/,"")),qp=new URLSearchParams(q);
var tok=hp.get("access_token"),code=qp.get("code");
var err=hp.get("error_description")||qp.get("error_description")||hp.get("error")||qp.get("error");
if(!tok&&!code&&!err)return;
var payload={};
if(tok){payload.access_token=tok;payload.refresh_token=hp.get("refresh_token");payload.type=hp.get("type");}
if(code)payload.code=code;
if(err)payload.error=err;
sessionStorage.setItem(${JSON.stringify(AUTH_CAPTURE_KEY)},JSON.stringify(payload));
qp.delete("code");qp.delete("error");qp.delete("error_description");qp.delete("confirmed");
var s=qp.toString();
history.replaceState({},"",location.pathname+(s?"?"+s:""));
}catch(e){}})();`;

export type AuthHandoff = {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  code?: string;
  error?: string;
};

/* Whether this page load arrived from a sign-in link.
 *
 * It used to be read off `?confirmed=1` in the URL. That stopped working the
 * moment the capture script started stripping the query — the check was
 * looking for a marker this file had just deleted. A flag set at the point
 * the session is actually installed cannot drift from the thing it describes
 * the way a URL convention can. */
let arrived = false;
export function markArrivedFromLink() {
  arrived = true;
}
/** True once, for the load that completed a sign-in link. */
export function arrivedFromLink() {
  const was = arrived;
  arrived = false;
  return was;
}

/** Read it once and remove it, so a refresh cannot replay a spent token. */
export function takeAuthHandoff(): AuthHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_CAPTURE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AUTH_CAPTURE_KEY);
    return JSON.parse(raw) as AuthHandoff;
  } catch {
    return null;
  }
}
