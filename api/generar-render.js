module.exports.config = {
  api: {
    bodyParser: { sizeLimit: '10mb' },
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { spatialDescription, quality, projectContext, floorPlanBase64 } = req.body;

    if (!floorPlanBase64) {
      return res.status(400).json({ error: 'Se requiere la imagen del plano para generar la maqueta exacta.' });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Falta la API Key de Replicate en las variables de entorno' });
    }

    let qualityPromptStr = 'Visual Style: Clean architectural clay maquette. Monochromatic matte white and light grey. Pure technical look.';
    if (quality === 'Lujo') {
      qualityPromptStr = 'Visual Style: Ultra-luxury interior design. High-end polished marble, premium dark hardwood, warm elegant LED ambient lighting, architectural photography.';
    } else if (quality === 'Medio') {
      qualityPromptStr = 'Visual Style: Realistic standard interior. Basic ceramic, standard tile floor, bright daylight lighting.';
    }

    const prompt = `${qualityPromptStr} ${projectContext || 'interior space'}. High definition 3D architectural render.`;

    const replicatePayload = {
      version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      input: {
        image: floorPlanBase64,
        prompt: prompt,
        a_prompt: "best quality, extremely detailed, photorealistic, 3d render, architectural photography, unreal engine 5, octane render",
        n_prompt: "lowres, bad architecture, messy lines, text, watermark, worst quality, low quality",
        image_resolution: "512",
        ddim_steps: 20,
        scale: 9,
        value_threshold: 0.1,
        distance_threshold: 0.1
      }
    };

    const replicateResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
      body: JSON.stringify(replicatePayload),
    });

    if (!replicateResponse.ok) {
      const errTxt = await replicateResponse.text();
      console.error("Replicate API Error:", errTxt);
      return res.status(replicateResponse.status).json({ error: "Replicate Error: " + errTxt });
    }

    const replicateData = await replicateResponse.json();
    
    // Devolvemos el ID de predicción para que el frontend pueda hacer polling
    return res.status(200).json({ predictionId: replicateData.id });

  } catch (error) {
    console.error("Error generating materials render:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
