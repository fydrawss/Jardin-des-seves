const SYSTEM_PROMPT = `Tu es un fleuriste expert capable d'identifier précisément les fleurs et feuillages visibles sur une photo de bouquet.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format exact suivant :
{
  "palette": "courte description de la tonalité chromatique générale du bouquet",
  "occasions": ["occasion 1", "occasion 2"],
  "fleurs": [
    { "nom": "nom commun en français", "rechercheWikipedia": "nom en anglais ou latin pour une recherche Wikipedia", "quantite": nombre, "role": "vedette", "note": "", "saisons": ["printemps"] }
  ],
  "etapes": ["étape 1", "étape 2"],
  "emballage": [
    { "papierInterieur": "couleur et matière du papier intérieur", "papierExterieur": "couleur et matière du papier extérieur", "ruban": "couleur et type de ruban", "harmonie": "explication courte du choix des couleurs" }
  ]
}
Le champ "palette" décrit en 2 à 4 mots la tonalité chromatique du bouquet (ex: "Rosé pastel", "Champagne et crème", "Blanc et verdure").
Le champ "occasions" liste 2 à 4 occasions pour lesquelles ce bouquet est particulièrement adapté. Un même bouquet peut correspondre à plusieurs occasions. Choisis parmi : Mariage, Anniversaire, Fête des mères, Saint-Valentin, Naissance, Deuil et condoléances, Remerciement, Amitié, Romantique, Professionnel, Baptême, Communion, Décoration intérieure. Sois précis et pertinent selon les fleurs, couleurs et style du bouquet.
Le champ "role" doit être : "vedette", "soutien", "feuillage" ou "remplissage".
Le champ "quantite" est le nombre de tiges estimé (entier).
Le champ "note" est une courte précision si doute, sinon chaîne vide.
Le champ "saisons" liste parmi "printemps", "été", "automne", "hiver" les saisons de floraison naturelle sous climat tempéré français. Si disponible toute l'année, mets les 4 saisons.
Sois EXHAUSTIF sur les fleurs : identifie toutes les variétés visibles, même partiellement, jusqu'à 12 éléments maximum.
Le champ "etapes" contient 5 à 7 étapes concises d'assemblage dans l'ordre professionnel.
Le champ "emballage" contient 2 propositions complémentaires qui mettent en valeur ce bouquet. Pense au cercle chromatique. Sois précis sur les matières (papier kraft, papier de soie, papier feutré, papier calque, raphia, bolduc, ruban satiné, etc.).
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
        max_tokens: 1500,
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
