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

    let qualityPromptStr = 'Visual Style: Clean minimalist 2D floor plan, top-down view, simple flat colors, neat furniture layout.';
    if (quality === 'Lujo') {
      qualityPromptStr = 'Visual Style: Premium real estate 2D floor plan, top-down view, luxury furnished, highly detailed textures, marble floors, elegant shadows, brochure style.';
    } else if (quality === 'Medio') {
      qualityPromptStr = 'Visual Style: Standard 2D floor plan, top-down view, furnished, clear room layout, wooden floors, realistic lighting, real estate brochure.';
    }

    const prompt = `${qualityPromptStr} ${projectContext || 'interior space'}. Top-down 2D architectural rendering, orthogonal projection, flat top view, real estate presentation.`;

    const replicatePayload = {
      version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      input: {
        image: floorPlanBase64,
        prompt: prompt,
        a_prompt: "top-down view, 2D floor plan, architectural diagram, real estate brochure, highly detailed, furnished, flat projection, professional",
        n_prompt: "3d render, perspective, side view, realistic photo, angle, isometric, messy lines, text, watermark",
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
