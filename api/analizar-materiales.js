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
      return res.status(401).json({ error: 'Falta la API Key de OpenAI en las variables de entorno' });
    }

    // Prepare OpenAI Payload
    const payload = {
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: 'Eres un Ingeniero Civil experto analizando un plano arquitectónico. Tu primera tarea es LEER los textos, etiquetas y mobiliario específico indicados. Tu segunda tarea es generar una "Descripción Espacial" detallada de la distribución del plano. NO deduzcas materiales de obra gris genéricos a menos que estén escritos. Analyze the plan image. In the JSON output, include a key "spatial_description" that provides a detailed narrative composition instruction for an interior room based strictly on the labeled elements in the plan. Describe the relative positions of everything (e.g. "The toilet is placed in the far-right corner..."). Devuelve EXCLUSIVAMENTE un único Objeto JSON con DOS propiedades estrictas requeridas: "materiales": Un Array de objetos con la lista (ej. [{"item": "Sanitário PCD", "cantidad": 1, "unidad": "pz"}]). "spatial_description": Un String con la descripción espacial.',
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
      
      let errorMsg = "Falló el procesamiento de IA";
      try {
          const parsed = JSON.parse(errorText);
          if (parsed.error && parsed.error.message) errorMsg = parsed.error.message;
      } catch (e) {}

      return res.status(response.status).json({ error: errorMsg });
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
    const spatial_description = parsedResult.spatial_description || "Interior room with provided materials.";

    return res.status(200).json({ materiales, spatial_description });

  } catch (error) {
    console.error("Error analyzing blueprint PDF/Image:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
