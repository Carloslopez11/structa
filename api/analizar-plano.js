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
          content: "Actúa como un 'Inspector Arquitectónico Estricto'. Analyze the provided image of a blueprint or sketch. Generate a JSON with a finite and closed inventory of EXACTLY what is on the blueprint. Do not invent spaces. Identify the main dimensions (length and width) of the space, the type of room it is (e.g., 'baño', 'cocina', 'habitación', 'sala', 'jardín', 'oficina', etc.), and determine the EXACT count of bedrooms and bathrooms present. Además, debes devolver un array JSON llamado desglose que contenga este inventario cerrado de cada espacio detectado con sus medidas aproximadas. Respond ONLY with a valid JSON object strictly in this format: {\"largo\": number, \"ancho\": number, \"tipo\": \"string\", \"habitaciones\": number, \"banos\": number, \"desglose\": [{\"nombre\": \"Sala\", \"largo\": 5, \"ancho\": 4}]}. Si no hay medidas evidentes y no puedes intuirlo, responde {\"largo\": 0, \"ancho\": 0, \"tipo\": \"desconocido\", \"habitaciones\": 0, \"banos\": 0, \"desglose\": []}.",
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
      max_tokens: 300,
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

        const baseImagePrompt = `Actúa como un diseñador de interiores premium y arquitecto. Transforma este plano 2D en un render 3D isométrico de lujo en alta definición. Tienes libertad creativa para proponer una distribución de mobiliario elegante, iluminación de estudio y texturas de alta gama para enamorar al cliente (este es un Boceto de Inspiración). SIN EMBARGO, debes mantener la lógica arquitectónica básica: NO elimines paredes estructurales, los baños DEBEN estar siempre en recintos cerrados con paredes completas, y respeta la distribución general de las habitaciones.`;

        const contextStr = `Mapeo estructural obligatorio detectado en la imagen: Espacio de tipo ${tipo}. Habitaciones totales exactas: ${habitaciones}. Baños totales exactos: ${banos}. Dimensiones del proyecto: ${largo}m x ${ancho}m. Acabados solicitados por nivel de calidad: ${qualityPromptStr}.`;
        
        const dallePayload = {
          model: "dall-e-3",
          prompt: `${baseImagePrompt}\n\n${contextStr}`,
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
