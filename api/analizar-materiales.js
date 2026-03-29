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
          content: 'Eres un Ingeniero Civil experto analizando un plano arquitectónico. Tu primera tarea es extraer los textos, etiquetas y mobiliario específico sin deducir materiales de obra gris a menos que estén escritos. Tu segunda tarea es mapear la ubicación exacta de cada pieza en un JSON estructurado de coordenadas. Tu tercera tarea es deducir el tipo de habitación y su contexto arquitectónico (ej. "Baño público PCD", "Cocina de restaurante", "Oficina moderna"). Devuelve EXCLUSIVAMENTE un único Objeto JSON con TRES propiedades requeridas: "materiales" (Array de objetos, ej. [{"item": "Sanitário PCD", "cantidad": 1, "unidad": "pz"}]), "spatial_description" (Array de objetos con distribución espacial, ej. [{"objeto": "Sanitário PCD", "ubicacion": "centro_inferior"}]) y "project_context" (String con el tipo de espacio).',
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
    const spatial_description = parsedResult.spatial_description || [];
    const project_context = parsedResult.project_context || "Habitación genérica";

    return res.status(200).json({ materiales, spatial_description, project_context });

  } catch (error) {
    console.error("Error analyzing blueprint PDF/Image:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
