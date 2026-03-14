// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDSpNqIsMjRMT-7FNRPGUayDBQKI_CvOjM",
  authDomain: "radius-cart.firebaseapp.com",
  projectId: "radius-cart",
  storageBucket: "radius-cart.firebasestorage.app",
  messagingSenderId: "355811086420",
  appId: "1:355811086420:web:0b88bceb849ccb1e8c9dc1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  
  self.registration.showNotification(title || 'Radius Cart', {
    body: body || 'You have a new notification',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open' },
    ],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
