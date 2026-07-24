// Firebase init (guarded like the Leaflet check in the original: falls back
// cleanly to localStorage-only when config is a placeholder or unavailable).
// Uses the compat SDK so the database/auth calls mirror the original code.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { FIREBASE_CONFIG, DB_PATH, CHAT_PATH } from './config';

let dbRef = null, chatRef = null, auth = null, remoteReady = false, authReady = false;

try {
  if (FIREBASE_CONFIG.databaseURL.indexOf('PASTE') === -1) {
    firebase.initializeApp(FIREBASE_CONFIG);
    dbRef = firebase.database().ref(DB_PATH);
    chatRef = firebase.database().ref(CHAT_PATH);
    remoteReady = true;
    if (FIREBASE_CONFIG.apiKey.indexOf('PASTE') === -1) {
      auth = firebase.auth();
      authReady = true;
    }
  }
} catch (e) {
  remoteReady = false; dbRef = null; chatRef = null; authReady = false; auth = null;
}

// ServerValue.TIMESTAMP for chat message timestamps (falls back to Date.now()).
export const serverTimestamp = () =>
  (firebase.database && firebase.database.ServerValue)
    ? firebase.database.ServerValue.TIMESTAMP
    : Date.now();

export { firebase, dbRef, chatRef, auth, remoteReady, authReady };
