export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { spatialDescription, quality } = req.body;

    if (!spatialDescription) {
      return res.status(400).json({ error: 'No spatial layout description provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(401).json({ error: 'Falta la API Key de OpenAI en las variables de entorno' });
    }

    let qualityPromptStr = "materiales de construcción estándar, acabados limpios pero básicos";
    if (quality === "Lujo") {
      qualityPromptStr = "materiales de altísima gama, pisos de mármol, maderas finas, diseño arquitectónico de lujo y acabados premium";
    } else if (quality === "Medio") {
      qualityPromptStr = "buenos materiales, diseño moderno, acabados de calidad";
    }

    const prompt = `Create a top-down, non-photorealistic architectural blueprint sketch in simplified geometric 3D. Use grey concrete blocks, no decoration, no realistic lighting. Always include text labels for the main elements. STRICTLY follow this coordinate layout to build the geometry: ${JSON.stringify(spatialDescription)}`;

    const dallePayload = {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    };

    const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(dallePayload),
    });

    if (!dalleResponse.ok) {
      const errTxt = await dalleResponse.text();
      console.error("DALL-E API Error:", errTxt);
      return res.status(dalleResponse.status).json({ error: "Fallo al generar imagen." });
    }

    const dalleData = await dalleResponse.json();
    const renderUrl = dalleData.data[0].url;

    return res.status(200).json({ renderUrl });

  } catch (error) {
    console.error("Error generating materials render:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
