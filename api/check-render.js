module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'No prediction ID provided' });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Falta la API Key de Replicate' });
    }

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("Replicate API Error (Check):", errTxt);
      return res.status(response.status).json({ error: "Replicate Error: " + errTxt });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error checking render status:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
