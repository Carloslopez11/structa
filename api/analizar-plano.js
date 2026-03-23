export const config = {
  maxDuration: 60, // set max duration for AI requests
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

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
          content: "You are an expert architect and blueprint reader. Analyze the provided image of a blueprint or sketch. Identify the main dimensions (length and width) of the space, the type of room it is (e.g., 'baño', 'cocina', 'habitación', 'sala', 'jardín', 'oficina', etc.), and determine the EXACT count of bedrooms and bathrooms present. Respond ONLY with a valid JSON object strictly in this format: {\"largo\": number, \"ancho\": number, \"tipo\": \"string\", \"habitaciones\": number, \"banos\": number}. Si no hay medidas evidentes y no puedes intuirlo, responde {\"largo\": 0, \"ancho\": 0, \"tipo\": \"desconocido\", \"habitaciones\": 0, \"banos\": 0}.",
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

    let renderUrl = null;
    if (largo > 0 || ancho > 0 || tipo !== "desconocido") {
      try {
        const dallePayload = {
          model: "dall-e-3",
          prompt: `Un render arquitectónico isométrico 3D hiperrealista de una casa familiar completa de un solo nivel (${tipo}). DEBE TENER EXACTAMENTE ${habitaciones} HABITACIONES, ${banos} BAÑOS, UNA SALA, UN COMEDOR Y UNA COCINA, organizados de forma idéntica a la distribución detectada en el plano. Mantén un estilo cálido residencial, con abundante luz natural, y utiliza materiales cálidos como pisos de madera y textiles suaves para que se sienta como un hogar acogedor. RESTRICCIÓN DE GENERACIÓN MUY ESTRICTA: Prohibido añadir elementos externos o estructurales no presentes en el plano (nada de patios adicionales, sin árboles dentro del edificio, sin balcones si no existen inicialmente). CRITICAL: DO NOT include any text, letters, measurements, or numbers in the image. The image must be purely visual 3D art without any annotations. The space represents approximately ${largo}m by ${ancho}m, but do not write this on the image.`,
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
      renderUrl
    });

  } catch (error) {
    console.error("Error analyzing blueprint:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
