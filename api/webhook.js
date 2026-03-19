const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Configuración de Vercel para desactivar el bodyParser por defecto
// Esto es requerido para que Stripe pueda verificar la firma de seguridad con el body original (raw).
const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Leer el body crudo (raw body) de la petición usando un stream
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
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Comprobar si fue una nueva suscripción exitosa o pago procesado
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    let email = '';

    if (event.type === 'checkout.session.completed') {
      email = event.data.object.customer_details?.email;
    } else {
      email = event.data.object.customer_email;
    }

    console.log(`Pago recibido de: ${email}. Actualizando a PRO...`);

    // Configuramos la llave para acualizar Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Actualizamos is_pro = true para el cliente que acaba de pagar
    if (email) {
      const { error: upsertError } = await supabase
        .from('usage')
        // Le damos PRO, y por si acaso reseteamos count a 0 aunque el límite de PRO sea infinito
        .upsert({ email: email, is_pro: true, count: 0 });

      if (upsertError) {
        console.error("Error al actualizar Supabase en el Webhook:", upsertError);
      } else {
        console.log(`Usuario ${email} actualizado a PRO con éxito.`);
      }
    }
  }

  res.status(200).send('Webhook process completed');
};

module.exports = handler;
module.exports.config = config;
