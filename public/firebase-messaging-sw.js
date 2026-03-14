// This file is intentionally minimal — no API keys here.
// The real service worker is served via /api/firebase-messaging-sw
// and loaded dynamically to keep credentials out of public files.
// Firebase SDK will find this file; it imports config from the API route above.
importScripts('/firebase-sw-loader.js');
