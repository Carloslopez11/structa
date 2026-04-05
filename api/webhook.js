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
    
    // Extract customer email comprehensively
    const email = session.customer_details?.email || session.customer_email || session.receipt_email;

    if (email) {
      console.log(`Payment received from: ${email}. Updating status to PRO...`);

      // Connect to Supabase using env variables
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Perform an explicit UPDATE searching EXACTLY by the email column
      let { data: updatedData, error: updateError } = await supabase
        .from('usage')
        .update({ 
          is_pro: true, 
          count: 0 
        })
        .eq('email', email)
        .select();

      // If the update succeeded but no rows were found, the user didn't exist in the usage table yet.
      // We insert them directly to avoid any onConflict schema issues.
      if (!updateError && (!updatedData || updatedData.length === 0)) {
        console.log(`No existing record found for ${email} in 'usage'. Inserting new PRO record...`);
        const { error: insertError } = await supabase
          .from('usage')
          .insert({ email: email, is_pro: true, count: 0 });
        
        if (insertError) {
           updateError = insertError;
        }
      }

      if (updateError) {
        console.error("Error updating/inserting Supabase record:", updateError);
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
