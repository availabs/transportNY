import get from 'lodash/get'

//-----------------------------------------------------
// Return values:
//   false            -> render the route
//   "authenticating" -> hold the route until the stored token has been checked
//   "sendToLogin"    -> route needs a session and there isn't a valid one
//   "sendToHome"     -> session exists but is below the route's auth level
//-----------------------------------------------------
const checkAuth = (props, navigate, location) => {

  let reqAuthLevel = get(props, "authLevel", -1);
  const authReq = get(props, "auth", false);
  reqAuthLevel = Math.max(reqAuthLevel, authReq ? 0 : -1);

  //-----------------------------------------------------
  // AuthProvider takes the token in localStorage on faith and only validates it
  // against the auth server afterwards; `isAuthenticating` covers that gap.
  // Rendering an auth-gated page during the gap lets it fire API calls with a
  // token the server is about to reject. Falcor caches the error nodes that come
  // back, and from then on every get() for those paths short-circuits on the
  // cached error without touching the network — for the life of the tab. That is
  // what leaves /folders/routes and /folders/reports blank after signing in with
  // an expired session, where only a hard refresh (a fresh falcor model) fixes
  // it. Hold auth-gated routes until the token is settled; routes that don't
  // require auth still render right away.
  //-----------------------------------------------------
  if (get(props, ["user", "isAuthenticating"], false)) {
    return reqAuthLevel >= 0 ? "authenticating" : false;
  }

  const userAuthed = get(props, ["user", "authed"], false);
  const userAuthLevel = get(props, ["user", "authLevel"], -1);

  const sendToLogin = !userAuthed && (reqAuthLevel >= 0);
  if (sendToLogin) return "sendToLogin";

  const sendToHome = userAuthLevel < reqAuthLevel;
  if (sendToHome) return "sendToHome";

  return false
}

export default checkAuth
