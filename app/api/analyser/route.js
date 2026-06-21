const SYSTEM_PROMPT = `Tu es un fleuriste expert capable d'identifier précisément les fleurs et feuillages visibles sur une photo de bouquet.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format exact suivant :
{
  "palette": "courte description de la tonalité chromatique générale du bouquet",
  "fleurs": [
    { "nom": "nom commun en français", "rechercheWikipedia": "nom en anglais ou latin pour une recherche Wikipedia", "quantite": nombre, "role": "vedette", "note": "", "saisons": ["printemps"] }
  ],
  "etapes": ["étape 1", "étape 2"]
}
Le champ "palette" décrit en 2 à 4 mots, avec un vocabulaire de fleuriste, la tonalité chromatique d'ensemble du bouquet (exemples : "Rosé pastel", "Champagne et crème", "Blanc et verdure", "Tons chauds corail", "Violet et prune", "Bicolore rose et blanc").
Le champ "role" doit être l'une de ces valeurs : "vedette", "soutien", "feuillage", "remplissage".
Le champ "quantite" est ton estimation du nombre de tiges visibles (nombre entier).
Le champ "note" est une courte précision uniquement si tu as un doute sur l'identification, sinon une chaîne vide.
Le champ "saisons" liste, parmi "printemps", "été", "automne", "hiver", la ou les saisons naturelles de floraison de cette fleur sous climat tempéré (France). Si la fleur ou le feuillage est disponible toute l'année (culture sous serre, feuillage persistant), mets les 4 saisons.
Limite-toi à 8 éléments maximum, les plus clairement identifiables.
Le champ "etapes" contient 5 à 7 étapes concises expliquant comment assembler ce bouquet à la main, dans l'ordre professionnel : base de feuillage, fleurs vedettes, fleurs de soutien, fleurs de remplissage, finitions, liage du bouquet.
Sois concis et précis.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { base64, mediaType } = body || {};

    if (!base64 || !mediaType) {
      return Response.json({ error: "Image manquante." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Clé API manquante côté serveur. Ajoute ANTHROPIC_API_KEY dans les variables d'environnement Vercel." },
        { status: 500 }
      );
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Voici la photo du bouquet à analyser. Réponds uniquement avec le JSON demandé, sans aucun texte autour." },
            ],
          },
        ],
      }),
    });

    const data = await anthropicResponse.json();
    return Response.json(data, { status: anthropicResponse.status });
  } catch (e) {
    return Response.json({ error: "Erreur serveur lors de l'analyse." }, { status: 500 });
  }
}
