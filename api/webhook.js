const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
    
    // Extract customer email
    const email = session.customer_details?.email || session.customer_email;

    if (email) {
      console.log(`Payment received from: ${email}. Updating status to PRO...`);

      // Connect to Supabase using env variables
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Update the user table (using 'usage' as it seems to be the active table for user state)
      // Changing status to PRO and resetting render counter
      const { error: updateError } = await supabase
        .from('usage')
        .upsert({ 
          email: email, 
          is_pro: true, 
          count: 0 
        }, { onConflict: 'email' });

      if (updateError) {
        console.error("Error updating Supabase:", updateError);
        // We still return 200 to Stripe so it doesn't retry the webhook constantly,
        // or we could return 500 depending on the desired retry logic.
        // Returning 200 as requested by the user: "Devuelve un status 200"
      } else {
        console.log(`User ${email} successfully updated to PRO.`);
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
