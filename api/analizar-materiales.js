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
          content: 'Eres un Ingeniero Civil experto. Analiza este plano arquitectónico. Extrae una lista detallada de todos los materiales, medidas (m2, metros lineales) y accesorios necesarios para la construcción/remodelación visible. Devuelve EXCLUSIVAMENTE un objeto JSON válido con la estructura: {"materiales": [{"item": "nombre", "cantidad": numero, "unidad": "m2/unidad"}]}. No incluyas texto adicional.',
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analiza el plano y entrega el JSON con la lista detallada de materiales.",
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
      max_tokens: 1500,
      temperature: 0.1, // Baja temperatura para rigor y precisión
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

    let parsedResult;
    try {
        parsedResult = JSON.parse(resultContent);
    } catch (e) {
        console.error("Error parsing OpenAI response", resultContent);
        return res.status(500).json({ error: "Invalid response from AI." });
    }
    
    const materiales = parsedResult.materiales || [];

    return res.status(200).json({ materiales });

  } catch (error) {
    console.error("Error analyzing blueprint PDF/Image:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
