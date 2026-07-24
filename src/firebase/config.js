/* ============================================================================
   SHARED SYNC + SIGN-IN CONFIG
   Paste your project's public Web API Key below (Firebase console → Project
   settings → General → "Web API Key"). It is NOT a secret — it only identifies
   the project; access is enforced by Firebase Authentication + database rules.
   The other values are already filled in from your database. See README.md for
   the accounts + rules setup.
   ============================================================================ */
export const FIREBASE_CONFIG = {
  apiKey:      "AIzaSyDzGWF278_tf3R4A1O9PrE7jgfgZw4CtJc",
  authDomain:  "tripvisualize.firebaseapp.com",
  projectId:   "tripvisualize",
  databaseURL: "https://tripvisualize-default-rtdb.europe-west1.firebasedatabase.app/"
};
export const TRIP_ID = "dr2026";                 // change to start a fresh, separate trip
export const DB_PATH = "trips/" + TRIP_ID;       // all shared state lives under this node
export const CHAT_PATH = "trips/" + TRIP_ID + "_chat"; // per-day chat: its own node so the itinerary blob write never overwrites it
export const EMAIL_DOMAIN = "tripvisualize.app"; // names map to <name>@<EMAIL_DOMAIN> for Firebase Auth
export const AVIV_EMAIL = "aviv@" + EMAIL_DOMAIN; // only this signed-in account sees the delete control

export const LS_KEY = "dr_itin_v3";
