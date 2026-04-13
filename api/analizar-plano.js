export const config = {
  maxDuration: 60, // set max duration for AI requests
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, quality } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY config missing');
      return res.status(500).json({ error: 'Server AI config missing' });
    }

    // Prepare OpenAI Payload
    const payload = {
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Actúa como un 'Inspector Arquitectónico Estricto'. Analyze the provided image of a blueprint or sketch. Generate a JSON with a closed inventory of EXACTLY what is on the blueprint. Do not invent spaces. Identify main dimensions (length and width), the type of room (e.g., 'baño', 'cocina', etc.), and the EXACT count of bedrooms and bathrooms. Add an array 'desglose' with each detected space and its approx dimensions. CRITICALLY: Include a field called 'prompt_visual'. This must be a highly descriptive text (in English, max 600 characters) designed for an AI image generator. Describe the exact spatial geometry, flow, door/window placements, and structural walls mathematically as seen on this specific blueprint, acting as a direct mapping instruction. Respond ONLY with a valid JSON strictly in this format: {\"largo\": number, \"ancho\": number, \"tipo\": \"string\", \"habitaciones\": number, \"banos\": number, \"prompt_visual\": \"string\", \"desglose\": [{\"nombre\": \"Sala\", \"largo\": 5, \"ancho\": 4}]}. Si no entiendes el plano, responde valores en cero y arrays vacíos.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the exact or best estimated length (largo), width (ancho) in numbers, the room type (tipo), and EXACTLY how many bedrooms (habitaciones) and bathrooms (banos) are visible in this blueprint.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 700,
      temperature: 0.1, // Baja temperatura para mayor rigor
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      return res.status(response.status).json({ error: "Failed to process image through AI." });
    }

    const data = await response.json();
    const resultContent = data.choices[0].message.content;

    const parsedResult = JSON.parse(resultContent);
    const largo = parseFloat(parsedResult.largo) || 0;
    const ancho = parseFloat(parsedResult.ancho) || 0;
    const tipo = parsedResult.tipo || "espacio arquitectónico";
    const habitaciones = parsedResult.habitaciones || 1;
    const banos = parsedResult.banos || 1;
    const prompt_visual = parsedResult.prompt_visual || "Standard architectural layout based on general room type geometry.";
    const desglose = parsedResult.desglose || [];

    let renderUrl = null;
    if (largo > 0 || ancho > 0 || tipo !== "desconocido") {
      try {
        let qualityPromptStr = "materiales de construcción estándar, acabados limpios pero básicos";
        if (quality === "Lujo") {
          qualityPromptStr = "materiales de altísima gama, pisos de mármol, maderas finas, diseño arquitectónico de lujo y acabados premium";
        } else if (quality === "Medio") {
          qualityPromptStr = "buenos materiales, diseño moderno, acabados de calidad";
        }

        const baseImagePrompt = `A MASTERPIECE highly detailed photorealistic 3D isometric architectural cutaway render of a luxury interior. Shot for Architectural Digest photography, rendered in Unreal Engine 5 with V-Ray, Corona Render, global illumination, raytracing, and cinematic studio lighting. 8k resolution, ultra-detailed textures, premium high-end aesthetics. ACT AS A STRICT ARCHITECT: you MUST faithfully follow the exact architectural layout provided. Do not delete structural walls. Bathrooms must remain enclosed.`;

        const contextStr = `PROJECT SPECS: ${tipo}. EXACT Rooms: ${habitaciones} bedrooms, ${banos} bathrooms. Size: ${largo}m x ${ancho}m. FINISHES: ${qualityPromptStr}.`;
        
        const blueprintMappingStr = `STRICT VISUAL BLUEPRINT MAPPING TO FOLLOW: ${prompt_visual}`;
        const promptFinal = `${baseImagePrompt}\n\n${contextStr}\n\n${blueprintMappingStr}`;

        const dallePayload = {
          model: "dall-e-3",
          prompt: promptFinal.substring(0, 3900),
          n: 1,
          size: "1024x1024",
          quality: "hd"
        };
        const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify(dallePayload),
        });
        if (dalleResponse.ok) {
          const dalleData = await dalleResponse.json();
          renderUrl = dalleData.data[0].url;
        } else {
          console.error("DALL-E API Error:", await dalleResponse.text());
        }
      } catch (dalleErr) {
        console.error("Error calling DALL-E:", dalleErr);
      }
    }

    return res.status(200).json({
      largo, 
      ancho,
      tipo,
      renderUrl,
      desglose
    });

  } catch (error) {
    console.error("Error analyzing blueprint:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
