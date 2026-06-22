"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Sparkles, RotateCcw, Flower2 } from "lucide-react";

const ROLE_LABELS = {
  vedette: "Fleur vedette",
  soutien: "Fleur de soutien",
  feuillage: "Feuillage",
  remplissage: "Remplissage",
};

const ROLE_COLORS = {
  vedette: "#6B1F45",
  soutien: "#9C6B82",
  feuillage: "#39553D",
  remplissage: "#B98A55",
};

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        resolve({ dataUrl, base64, mediaType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCurrentSeasonFR() {
  const month = new Date().getMonth();
  if (month <= 1 || month === 11) return "hiver";
  if (month >= 2 && month <= 4) return "printemps";
  if (month >= 5 && month <= 7) return "été";
  return "automne";
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categorizePalette(text) {
  const t = normalize(text);
  if (/rouge|corail|brique|carmin/.test(t)) return { label: "Rouge & corail", emoji: "🌹" };
  if (/orange|abricot|peche|cuivr/.test(t)) return { label: "Orangé & cuivré", emoji: "🧡" };
  if (/jaune|dore|moutarde/.test(t)) return { label: "Jaune & doré", emoji: "🌻" };
  if (/vert|verdure|olive|sauge/.test(t)) return { label: "Vert & verdure", emoji: "🌿" };
  if (/champagne|beige|nude/.test(t)) return { label: "Champagne & nude", emoji: "🤎" };
  if (/blanc|ivoire|creme/.test(t)) return { label: "Blanc & ivoire", emoji: "🤍" };
  if (/rose|pastel|fuchsia/.test(t)) return { label: "Rosé & pastel", emoji: "🌸" };
  if (/violet|prune|mauve|lilas/.test(t)) return { label: "Violet & prune", emoji: "🪻" };
  if (/bleu/.test(t)) return { label: "Bleu", emoji: "💙" };
  return { label: "Tons mélangés", emoji: "🎨" };
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return cleaned.slice(start, end + 1);
}

async function fetchFlowerImage(term) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=440&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query && data.query.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page && page.thumbnail ? page.thumbnail.source : null;
  } catch (e) {
    return null;
  }
}

async function fetchWrappingImage(term) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=440&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query && data.query.pages;
    if (!pages) return null;
    const pagesArr = Object.values(pages);
    for (const page of pagesArr) {
      if (page.thumbnail) return page.thumbnail.source;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function GenericFlowerIcon() {
  return (
    <svg viewBox="0 0 40 40" width="44" height="44">
      <g transform="translate(20,20)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-9} rx={6} ry={9} fill="#D8C3D4" transform={`rotate(${a})`} />
        ))}
        <circle r={4} fill="#9C6B82" />
      </g>
    </svg>
  );
}

function FlowerResultCard({ flower }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgState, setImgState] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setImgState("loading");
    fetchFlowerImage(flower.rechercheWikipedia || flower.nom).then((src) => {
      if (cancelled) return;
      if (src) { setImgSrc(src); setImgState("ok"); }
      else setImgState("empty");
    });
    return () => { cancelled = true; };
  }, [flower.rechercheWikipedia, flower.nom]);

  const currentSeason = getCurrentSeasonFR();
  const seasons = Array.isArray(flower.saisons) ? flower.saisons : [];
  const isYearRound = seasons.length >= 4;
  const inSeason = seasons.includes(currentSeason);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #EADFE8", borderRadius: "1rem", overflow: "hidden" }}>
      <div style={{ aspectRatio: "4 / 3", background: "#F7F1F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgState === "loading" && <span style={{ fontSize: "0.75rem", color: "#9C6B82" }}>chargement…</span>}
        {imgState === "ok" && <img src={imgSrc} alt={flower.nom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {imgState === "empty" && <GenericFlowerIcon />}
      </div>
      <div style={{ padding: "0.9rem" }}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm" style={{ color: "#2B2230" }}>{flower.nom}</span>
          <span className="text-xs font-medium" style={{ color: "#6B1F45", flexShrink: 0 }}>× {flower.quantite}</span>
        </div>
        <span className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
          style={{ background: (ROLE_COLORS[flower.role] || "#9C6B82") + "1A", color: ROLE_COLORS[flower.role] || "#9C6B82" }}>
          {ROLE_LABELS[flower.role] || flower.role}
        </span>
        {seasons.length > 0 && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: isYearRound ? "#8A7C87" : inSeason ? "#39553D" : "#B98A55" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: isYearRound ? "#B5A6B2" : inSeason ? "#39553D" : "#B98A55", display: "inline-block" }} />
            {isYearRound ? "Disponible toute l'année" : inSeason ? "De saison actuellement" : "Hors saison (" + seasons.join(", ") + ")"}
          </p>
        )}
        {flower.note ? <p className="text-xs mt-2" style={{ color: "#8A7C87" }}>{flower.note}</p> : null}
      </div>
    </div>
  );
}

function EmballageCard({ proposition, index }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgState, setImgState] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setImgState("loading");
    const term = proposition.rechercheImage || "florist paper wrapping bouquet";
    fetchWrappingImage(term).then((src) => {
      if (cancelled) return;
      if (src) { setImgSrc(src); setImgState("ok"); }
      else setImgState("empty");
    });
    return () => { cancelled = true; };
  }, [proposition.rechercheImage]);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #EADFE8", borderRadius: "1rem", overflow: "hidden" }}>
      <div style={{ aspectRatio: "4 / 3", background: "#F7F1F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {imgState === "loading" && <span style={{ fontSize: "0.75rem", color: "#9C6B82" }}>chargement…</span>}
        {imgState === "ok" && <img src={imgSrc} alt="Emballage" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        {imgState === "empty" && (
          <svg viewBox="0 0 40 40" width="44" height="44">
            <rect x="8" y="12" width="24" height="20" rx="2" fill="none" stroke="#D8C3D4" strokeWidth="2" />
            <path d="M8 18 Q20 24 32 18" stroke="#D8C3D4" strokeWidth="1.5" fill="none" />
          </svg>
        )}
      </div>
      <div style={{ padding: "0.9rem" }}>
        <p className="text-xs font-semibold mb-2" style={{ color: "#6B1F45" }}>Proposition {index + 1}</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 text-xs" style={{ color: "#2B2230" }}>
            <span style={{ color: "#9C6B82", flexShrink: 0, minWidth: 90 }}>Papier intérieur</span>
            <span>{proposition.papierInterieur}</span>
          </div>
          <div className="flex gap-2 text-xs" style={{ color: "#2B2230" }}>
            <span style={{ color: "#9C6B82", flexShrink: 0, minWidth: 90 }}>Papier extérieur</span>
            <span>{proposition.papierExterieur}</span>
          </div>
          <div className="flex gap-2 text-xs" style={{ color: "#2B2230" }}>
            <span style={{ color: "#9C6B82", flexShrink: 0, minWidth: 90 }}>Ruban</span>
            <span>{proposition.ruban}</span>
          </div>
          {proposition.harmonie && (
            <p className="text-xs mt-1 pt-1" style={{ color: "#8A7C87", borderTop: "1px solid #F3EAF1" }}>
              {proposition.harmonie}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const HISTORY_KEY = "jds_historique";
const MAX_HISTORY = 20;

function makeThumbnail(dataUrl, maxDim) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const scale = maxDim / Math.max(width, height);
      if (scale < 1) { width = Math.round(width * scale); height = Math.round(height * scale); }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.5));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export default function JardinDesSeves() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {}
  }, []);

  async function saveToHistory(image, parsedResult) {
    try {
      const thumb = await makeThumbnail(image.dataUrl, 160);
      const entry = { id: Date.now().toString(), date: new Date().toISOString(), thumb, result: parsedResult };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch (e) {}
        return next;
      });
    } catch (e) {}
  }

  function viewHistoryEntry(entry) {
    setResult(entry.result);
    setUploadedImage({ dataUrl: entry.thumb, base64: null, mediaType: null });
    setShowHistory(false);
    setShowPalette(false);
    setError(null);
  }

  function deleteHistoryEntry(id) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
  }

  async function handleFile(file) {
    if (!file) return;
    setError(null); setResult(null);
    try {
      const img = await resizeImage(file);
      setUploadedImage(img);
    } catch (e) {
      setError("Impossible de lire cette image. Essaie un autre fichier.");
    }
  }

  async function analyze() {
    if (!uploadedImage) return;
    setIsAnalyzing(true); setError(null); setResult(null);
    try {
      const response = await fetch("/api/analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: uploadedImage.base64, mediaType: uploadedImage.mediaType }),
      });
      const data = await response.json();
      if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message);
      const textBlock = (data.content || []).find((b) => b.type === "text");
      if (!textBlock) throw new Error("Réponse vide du modèle");
      const jsonString = extractJson(textBlock.text);
      if (!jsonString) throw new Error("Pas de JSON exploitable dans la réponse");
      const parsed = JSON.parse(jsonString);
      if (!parsed.fleurs || !Array.isArray(parsed.fleurs)) throw new Error("Format de réponse inattendu");
      setResult(parsed);
      saveToHistory(uploadedImage, parsed);
    } catch (e) {
      setError("L'analyse a échoué — détail : " + (e && e.message ? e.message : "erreur inconnue"));
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setUploadedImage(null); setResult(null); setError(null);
  }

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F7F1F6", color: "#2B2230", fontFamily: "'Quicksand', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Quicksand:wght@400;500;600;700&display=swap');
        .jds-script { font-family: 'Caveat', cursive; }
        .jds-title { font-size: clamp(1.5rem, 7.5vw, 3rem); white-space: nowrap; }
        .dropzone { transition: border-color 0.2s ease, background 0.2s ease; }
        .dropzone.drag { border-color: #6B1F45 !important; background: #F3E9F1 !important; }
      `}</style>

      <header style={{ background: "#ECDFEB" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }} className="px-4 sm:px-8 pt-12 pb-10">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <span style={{ position: "absolute", inset: "-6px -12px", background: "#F3E2EF", transform: "rotate(-1deg)", zIndex: 0, borderRadius: "0.25rem" }}></span>
                <h1 className="jds-script jds-title" style={{ position: "relative", zIndex: 1, fontWeight: 700, color: "#6B1F45", lineHeight: 1 }}>
                  Jardin Des Sèves
                </h1>
              </div>
              <div style={{ position: "relative", display: "inline-block", marginTop: "0.5rem" }}>
                <span style={{ position: "absolute", inset: "-4px -10px", background: "#39553D", zIndex: 0 }}></span>
                <p style={{ position: "relative", zIndex: 1, color: "#FFFFFF", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Pour des bouquets qui durent
                </p>
              </div>
            </div>
            <img src="/logo.png" alt="Logo Jardin Des Sèves" style={{ width: "92px", height: "92px", flexShrink: 0, objectFit: "contain" }} />
          </div>
          <p className="text-sm mt-5" style={{ color: "#6B5566", maxWidth: "32rem" }}>
            Dépose une photo de bouquet : l'atelier identifie les fleurs et feuillages utilisés, leur nombre, et te montre comment le reproduire, étape par étape.
          </p>
        </div>
      </header>

      <main style={{ maxWidth: "56rem", margin: "0 auto" }} className="px-4 sm:px-8 py-10">
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={() => { setShowPalette((v) => !v); setShowHistory(false); }}
            className="text-sm rounded-full px-4 py-2"
            style={{ border: "1px solid #D8C3D4", color: "#6B1F45", background: showPalette ? "#F3E2EF" : "transparent" }}
          >
            Par couleur
          </button>
          <button
            onClick={() => { setShowHistory((v) => !v); setShowPalette(false); }}
            className="text-sm rounded-full px-4 py-2"
            style={{ border: "1px solid #D8C3D4", color: "#6B1F45", background: showHistory ? "#F3E2EF" : "transparent" }}
          >
            Historique {history.length > 0 ? `(${history.length})` : ""}
          </button>
        </div>

        {showPalette ? (
          <div>
            {(() => {
              const withPalette = history.filter((e) => e.result && e.result.palette);
              if (withPalette.length === 0) return (
                <p className="text-sm" style={{ color: "#8A7C87" }}>
                  Aucun bouquet classé pour l'instant. Analyse un nouveau bouquet pour commencer.
                </p>
              );
              const groups = {};
              withPalette.forEach((entry) => {
                const cat = categorizePalette(entry.result.palette);
                if (!groups[cat.label]) groups[cat.label] = { emoji: cat.emoji, entries: [] };
                groups[cat.label].entries.push(entry);
              });
              return Object.entries(groups).map(([label, group]) => (
                <div key={label} className="mb-7">
                  <h3 className="text-sm font-medium mb-2" style={{ color: "#6B1F45" }}>
                    {group.emoji} {label} <span style={{ color: "#9C8C97", fontWeight: 400 }}>({group.entries.length})</span>
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.7rem" }}>
                    {group.entries.map((entry) => (
                      <button key={entry.id} onClick={() => viewHistoryEntry(entry)}
                        style={{ background: "#FFFFFF", border: "1px solid #EADFE8", borderRadius: "0.85rem", overflow: "hidden", cursor: "pointer" }}>
                        {entry.thumb
                          ? <img src={entry.thumb} alt="Bouquet" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
                          : <div style={{ aspectRatio: "4 / 3", background: "#F7F1F6" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : showHistory ? (
          <div>
            {history.length === 0 ? (
              <p className="text-sm" style={{ color: "#8A7C87" }}>Aucune analyse enregistrée pour l'instant.</p>
            ) : (
              <>
                <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Rechercher une fleur…" className="text-sm mb-4"
                  style={{ width: "100%", padding: "0.6rem 0.9rem", borderRadius: "0.75rem", border: "1px solid #D8C3D4", background: "#FFFFFF", color: "#2B2230" }} />
                {(() => {
                  const filtered = historySearch.trim()
                    ? history.filter((entry) => entry.result && Array.isArray(entry.result.fleurs) &&
                        entry.result.fleurs.some((f) => normalize(f.nom).includes(normalize(historySearch))))
                    : history;
                  if (filtered.length === 0) return <p className="text-sm" style={{ color: "#8A7C87" }}>Aucun bouquet trouvé pour « {historySearch} ».</p>;
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.9rem" }} className="mb-4">
                      {filtered.map((entry) => (
                        <div key={entry.id} style={{ background: "#FFFFFF", border: "1px solid #EADFE8", borderRadius: "1rem", overflow: "hidden" }}>
                          <button onClick={() => viewHistoryEntry(entry)} style={{ display: "block", width: "100%", cursor: "pointer" }}>
                            {entry.thumb
                              ? <img src={entry.thumb} alt="Bouquet" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover" }} />
                              : <div style={{ aspectRatio: "4 / 3", background: "#F7F1F6" }} />}
                            <div style={{ padding: "0.6rem" }}>
                              <p className="text-xs" style={{ color: "#8A7C87" }}>
                                {new Date(entry.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                              </p>
                              <p className="text-xs font-medium mt-0.5" style={{ color: "#2B2230" }}>
                                {entry.result?.fleurs?.[0]?.nom || "Bouquet"}
                              </p>
                              {entry.result?.palette && <p className="text-xs mt-0.5" style={{ color: "#9C6B82" }}>{entry.result.palette}</p>}
                            </div>
                          </button>
                          <button onClick={() => deleteHistoryEntry(entry.id)} className="text-xs w-full"
                            style={{ color: "#B98A55", padding: "0.4rem", borderTop: "1px solid #EADFE8" }}>
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <button onClick={clearHistory} className="text-xs" style={{ color: "#8A7C87", textDecoration: "underline" }}>
                  Vider tout l'historique
                </button>
              </>
            )}
          </div>
        ) : (
        <>
        <div className="dropzone"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("drag")}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("drag"); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: "2px dashed #D8C3D4", borderRadius: "1.25rem", padding: uploadedImage ? "1rem" : "2.5rem 1.5rem", textAlign: "center", cursor: "pointer", background: "#FFFFFF" }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])} />
          {!uploadedImage ? (
            <div>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
                <Upload size={28} color="#9C6B82" />
              </div>
              <p className="text-sm font-medium" style={{ color: "#2B2230" }}>Dépose une photo de bouquet ici</p>
              <p className="text-xs mt-1" style={{ color: "#9C8C97" }}>ou clique pour choisir un fichier — JPG, PNG</p>
            </div>
          ) : (
            <img src={uploadedImage.dataUrl} alt="Bouquet à analyser"
              style={{ maxHeight: "320px", margin: "0 auto", borderRadius: "0.75rem", display: "block" }} />
          )}
        </div>

        {uploadedImage && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {uploadedImage.base64 && (
              <button onClick={(e) => { e.stopPropagation(); analyze(); }} disabled={isAnalyzing}
                className="flex items-center gap-2 text-sm font-medium rounded-full px-5 py-2.5"
                style={{ background: "#6B1F45", color: "#FFFFFF", opacity: isAnalyzing ? 0.7 : 1 }}>
                <Sparkles size={16} /> {isAnalyzing ? "Analyse en cours…" : "Analyser ce bouquet"}
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); reset(); }}
              className="flex items-center gap-2 text-sm rounded-full px-4 py-2.5"
              style={{ border: "1px solid #D8C3D4", color: "#6B5566" }}>
              <RotateCcw size={14} /> {uploadedImage.base64 ? "Recommencer" : "Nouvelle photo"}
            </button>
          </div>
        )}

        {error && (
          <div className="text-sm mt-6 rounded-xl px-4 py-3"
            style={{ background: "#FBEAEA", color: "#8A2D2D", border: "1px solid #F0C9C9" }}>
            {error}
          </div>
        )}

        {result && (
          <div className="mt-10">
            <h2 className="jds-script" style={{ fontSize: "1.8rem", color: "#6B1F45" }}>Composition identifiée</h2>
            {result.palette && (
              <span className="inline-block text-xs font-medium mt-1 px-3 py-1 rounded-full"
                style={{ background: "#F3E2EF", color: "#6B1F45" }}>
                🎨 {result.palette}
              </span>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.9rem" }} className="mt-3">
              {result.fleurs.map((f, i) => <FlowerResultCard key={i} flower={f} />)}
            </div>

            <h2 className="jds-script mt-10" style={{ fontSize: "1.8rem", color: "#6B1F45" }}>Étapes pour le reproduire</h2>
            <ol className="mt-3 flex flex-col gap-3">
              {result.etapes.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "#2B2230" }}>
                  <span className="flex items-center justify-center font-medium"
                    style={{ width: 26, height: 26, borderRadius: 999, background: "#ECDFEB", color: "#6B1F45", flexShrink: 0, fontSize: "0.8rem" }}>
                    {i + 1}
                  </span>
                  <span style={{ paddingTop: "0.15rem" }}>{step}</span>
                </li>
              ))}
            </ol>

            {result.emballage && Array.isArray(result.emballage) && result.emballage.length > 0 && (
              <div className="mt-10">
                <h2 className="jds-script" style={{ fontSize: "1.8rem", color: "#6B1F45" }}>Suggestions d'emballage</h2>
                <p className="text-xs mt-1 mb-3" style={{ color: "#8A7C87" }}>
                  Propositions pensées pour mettre ce bouquet en valeur.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.9rem" }}>
                  {result.emballage.map((p, i) => <EmballageCard key={i} proposition={p} index={i} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !error && !uploadedImage && (
          <div className="flex flex-col items-center mt-10 text-center" style={{ color: "#B5A6B2" }}>
            <Flower2 size={28} />
            <p className="text-sm mt-2">En attente d'une photo de bouquet à analyser.</p>
          </div>
        )}
        </>
        )}
      </main>

      <footer style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem 1.5rem" }}>
        <img src="/footer.png" alt="Jardin Des Sèves"
          style={{ width: "100%", maxWidth: "340px", height: "auto", opacity: 0.92 }} />
      </footer>
    </div>
  );
}
