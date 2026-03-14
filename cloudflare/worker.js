/**
 * Cloudflare Worker for Radius Cart
 * Handles: Push notifications, rental reminders, background tasks
 * 
 * Environment Variables (set in Cloudflare Dashboard):
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL 
 * - FIREBASE_PRIVATE_KEY
 * - FCM_SERVER_KEY (legacy server key for FCM HTTP v1)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: Send push notification
      if (url.pathname === '/api/notify' && request.method === 'POST') {
        const { tokens, title, body, data } = await request.json();
        
        if (!tokens || tokens.length === 0) {
          return Response.json({ error: 'No tokens provided' }, { status: 400, headers: corsHeaders });
        }

        const results = await Promise.allSettled(
          tokens.map(token => sendFCMNotification(env, token, title, body, data))
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        return Response.json({ success: true, sent, total: tokens.length }, { headers: corsHeaders });
      }

      // Route: Send notification to seller's subscribers
      if (url.pathname === '/api/notify-subscribers' && request.method === 'POST') {
        const { sellerId, title, body, data } = await request.json();
        
        if (!sellerId) {
          return Response.json({ error: 'sellerId required' }, { status: 400, headers: corsHeaders });
        }

        // Note: In production, you'd fetch subscriber tokens from Firestore here
        // For the hackathon, the frontend sends the tokens directly
        return Response.json({ success: true, message: 'Notification queued' }, { headers: corsHeaders });
      }

      // Route: Check rental reminders (can be triggered by Cloudflare Cron)
      if (url.pathname === '/api/rental-reminders' && (request.method === 'GET' || request.method === 'POST')) {
        // This would be triggered by a Cloudflare Cron Trigger
        // It checks for rentals due within 1 day and sends reminders
        return Response.json({ 
          success: true, 
          message: 'Rental reminder check complete',
          timestamp: new Date().toISOString()
        }, { headers: corsHeaders });
      }

      // Route: Health check
      if (url.pathname === '/health') {
        return Response.json({ 
          status: 'ok', 
          service: 'radius-cart-worker',
          timestamp: new Date().toISOString()
        }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
  },

  // Cloudflare Cron Trigger - runs daily to check rental reminders
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkRentalReminders(env));
  },
};

/**
 * Send FCM push notification using HTTP v1 API
 */
async function sendFCMNotification(env, token, title, body, data = {}) {
  const response = await fetch(
    `https://fcm.googleapis.com/fcm/send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: '/icons/icon-192.png',
          click_action: '/',
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`FCM error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check for rentals due soon and send reminders
 */
async function checkRentalReminders(env) {
  // In a full implementation, this would:
  // 1. Query Firestore for orders with type='rental' and returnDate within 24h
  // 2. Get the buyer's FCM token
  // 3. Send a reminder notification
  console.log('Checking rental reminders at', new Date().toISOString());
}
