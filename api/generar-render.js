export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { spatialDescription, quality, projectContext } = req.body;

    if (!spatialDescription) {
      return res.status(400).json({ error: 'No spatial layout description provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(401).json({ error: 'Falta la API Key de OpenAI en las variables de entorno' });
    }

    let qualityPromptStr = 'Visual Style: Clean architectural clay maquette. Monochromatic matte white and light grey. No textures. Pure technical look.';
    if (quality === 'Lujo') {
      qualityPromptStr = 'Visual Style: Ultra-luxury interior design. High-end polished marble walls, premium dark hardwood or luxury tile floor. The toilet and sink are premium ceramic. Grab bars are brushed gold or brass. Warm, elegant LED ambient lighting.';
    } else if (quality === 'Medio') {
      qualityPromptStr = 'Visual Style: Realistic standard interior. Basic white ceramic toilet and sink, standard white tile floor, plain painted walls, bright daylight lighting.';
    }

    const negativeConstraints = `CRITICAL RULE: NEVER hallucinate or add any furniture, decorations, doors, or windows that are not explicitly provided in the input JSON. If a space is empty in the input, leave it completely empty. Maintain a hyper-realistic, strict architectural visualization style. Professional and clean.`;
    const architecturalBase = `Create a high-definition isometric 3D architectural cutaway of a ${projectContext || 'interior space'}. The room MUST have a solid floor slab and two visible walls. STRICT GEOMETRY: ${JSON.stringify(spatialDescription)}. Strictly ONLY use provided items.`;
    const grabBarsPrecision = `CRITICAL: If the list includes grab bars (barras de apoyo), they MUST be metallic and attached directly to the wall immediately next to and behind the toilet. Do not scatter them like towel racks.`;
    const textsConstraint = `Keep text labels minimal and highly legible. Only write explicit dimensions like "0.80m" and "PCD".`;

    const prompt = `${architecturalBase} ${negativeConstraints} ${grabBarsPrecision} ${qualityPromptStr} ${textsConstraint}`;

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
