const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback';
const stripe = require('stripe')(stripeKey);
const { createClient } = require('@supabase/supabase-js');

// Vercel config to disable default body parser
// This is required so Stripe can verify the security signature with the raw body.
const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Read the raw body from the request stream
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Listen specifically for checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract customer email comprehensively
    const email = session.customer_details?.email || session.customer_email || session.receipt_email;

    if (email) {
      console.log(`Payment received from: ${email}. Updating status to PRO...`);

      // Connect to Contabo DB using our _db helper
      const db = require('./_db');

      try {
        const existing = await db.query('SELECT email FROM usage WHERE email = $1', [email]);
        
        if (existing.rows.length > 0) {
          console.log(`Updating existing record for ${email} in usage...`);
          await db.query('UPDATE usage SET is_pro = true, count = 0 WHERE email = $1', [email]);
        } else {
          console.log(`No existing record found for ${email}. Inserting new PRO record...`);
          await db.query('INSERT INTO usage (email, is_pro, count) VALUES ($1, true, 0)', [email]);
        }
        console.log(`User ${email} successfully updated to PRO.`);
      } catch (dbError) {
        console.error("Error updating/inserting Contabo DB record:", dbError);
      }
    } else {
      console.warn('checkout.session.completed event received, but no email was found.');
    }
  } else {
    // Unhandled event type
    console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

module.exports = handler;
module.exports.config = config;
