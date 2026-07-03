// Éditeur de mission : métadonnées, scènes et énigmes (5 types),
// import/export JSON, lien de partage, banque de questions ISO 26000.
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  Copy,
  Download,
  Play,
  Plus,
  Settings,
  Share2,
  Trash2,
  Upload,
} from "lucide-react";
import { DEFAULT_SCENE, ISO_26000_TAGS, QUESTION_BANK } from "../data.js";
import { makeId, normalizeGame } from "../lib/game.js";
import { downloadJSON, encodeGameParam, readFileAsText, slugify } from "../lib/storage.js";

const PUZZLE_TYPE_LABELS = {
  qcm: "QCM",
  codelock: "Code secret",
  match: "Associations",
  ordering: "Ordonnancement",
  hotspot: "Hotspots (image)",
};

function MediaPreview({ url }) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      {url.match(/\.(mp4|webm|ogg)$/i) ? (
        <video controls className="max-h-72 w-full object-cover">
          <source src={url} />
        </video>
      ) : (
        <img src={url} alt="Aperçu du média de la scène" className="max-h-72 w-full object-cover" />
      )}
    </div>
  );
}

function SceneCard({ scene, index, onChange, onDelete, onDuplicate }) {
  const puzzle = scene.puzzle;
  // Mises à jour immuables : on reconstruit l'objet au lieu de le muter.
  const patchScene = (patch) => onChange({ ...scene, ...patch });
  const patchPuzzle = (patch) => onChange({ ...scene, puzzle: { ...puzzle, ...patch } });
  const patchHotspots = (patch) =>
    patchPuzzle({ hotspots: { image: "", targets: [], ...puzzle.hotspots, ...patch } });

  return (
    <motion.div layout className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip !border-amber-400/40 !text-amber-300">Scène {index + 1}</span>
        <div className="flex-1" />
        <button className="btn btn-ghost !px-2.5 text-xs" onClick={onDuplicate} title="Dupliquer la scène">
          <Copy className="h-4 w-4" aria-hidden="true" /> Dupliquer
        </button>
        <button className="btn btn-danger !px-2.5 text-xs" onClick={onDelete}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Supprimer
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="input font-semibold"
          aria-label="Titre de la scène"
          value={scene.title}
          onChange={(e) => patchScene({ title: e.target.value })}
        />
        <select
          className="input"
          aria-label="Question centrale ISO 26000"
          value={scene.isoTag}
          onChange={(e) => patchScene({ isoTag: e.target.value })}
        >
          {ISO_26000_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="input"
        rows={3}
        aria-label="Narratif de la scène"
        value={scene.narrative}
        onChange={(e) => patchScene({ narrative: e.target.value })}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <div>
            <label className="label mb-1">URL média (image/vidéo) optionnelle</label>
            <input
              className="input"
              value={scene.mediaUrl}
              onChange={(e) => patchScene({ mediaUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="label whitespace-nowrap">Type d'énigme</span>
            <select
              className="input"
              aria-label="Type d'énigme"
              value={puzzle.type}
              onChange={(e) => patchPuzzle({ type: e.target.value })}
            >
              {Object.entries(PUZZLE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {puzzle.type === "qcm" && (
            <div className="space-y-2">
              <input
                className="input"
                aria-label="Question du QCM"
                value={puzzle.question || ""}
                onChange={(e) => patchPuzzle({ question: e.target.value })}
              />
              {(puzzle.options || []).map((option, idx) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    aria-label={`Option ${idx + 1}`}
                    value={option.text}
                    onChange={(e) => {
                      const options = [...puzzle.options];
                      options[idx] = { ...option, text: e.target.value };
                      patchPuzzle({ options });
                    }}
                  />
                  <label className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-amber-400"
                      checked={option.correct}
                      onChange={(e) => {
                        const options = [...puzzle.options];
                        options[idx] = { ...option, correct: e.target.checked };
                        patchPuzzle({ options });
                      }}
                    />
                    Correct
                  </label>
                  <button
                    className="btn btn-danger !px-2.5 text-xs"
                    aria-label={`Supprimer l'option ${idx + 1}`}
                    onClick={() => patchPuzzle({ options: puzzle.options.filter((x) => x.id !== option.id) })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                className="btn text-xs"
                onClick={() =>
                  patchPuzzle({
                    options: [...(puzzle.options || []), { id: Date.now(), text: "Nouvelle option", correct: false }],
                  })
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter option
              </button>
            </div>
          )}

          {puzzle.type === "codelock" && (
            <div className="space-y-2">
              <label className="label">Consigne / indice affiché</label>
              <input
                className="input"
                value={puzzle.question || ""}
                onChange={(e) => patchPuzzle({ question: e.target.value })}
                placeholder="Ex : Additionnez les chiffres..."
              />
              <label className="label">Code attendu</label>
              <input
                className="input"
                value={puzzle.answer || ""}
                onChange={(e) => patchPuzzle({ answer: e.target.value })}
                placeholder="Ex : 26000"
              />
            </div>
          )}

          {puzzle.type === "match" && (
            <div className="space-y-2">
              <label className="label">Paires à associer (gauche → droite)</label>
              {(puzzle.pairs || []).map((pair, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input
                    className="input"
                    aria-label={`Élément gauche ${idx + 1}`}
                    value={pair.left}
                    onChange={(e) => {
                      const pairs = [...puzzle.pairs];
                      pairs[idx] = { ...pair, left: e.target.value };
                      patchPuzzle({ pairs });
                    }}
                  />
                  <input
                    className="input"
                    aria-label={`Élément droit ${idx + 1}`}
                    value={pair.right}
                    onChange={(e) => {
                      const pairs = [...puzzle.pairs];
                      pairs[idx] = { ...pair, right: e.target.value };
                      patchPuzzle({ pairs });
                    }}
                  />
                </div>
              ))}
              <button
                className="btn text-xs"
                onClick={() => patchPuzzle({ pairs: [...(puzzle.pairs || []), { left: "", right: "" }] })}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter paire
              </button>
            </div>
          )}

          {puzzle.type === "ordering" && (
            <div className="space-y-2">
              <label className="label">Éléments à ordonner (de haut en bas)</label>
              {(puzzle.ordering || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    aria-label={`Élément ${idx + 1}`}
                    value={item}
                    onChange={(e) => {
                      const ordering = [...puzzle.ordering];
                      ordering[idx] = e.target.value;
                      patchPuzzle({ ordering, orderingCorrect: ordering });
                    }}
                  />
                  <button
                    className="btn btn-danger !px-2.5 text-xs"
                    aria-label={`Supprimer l'élément ${idx + 1}`}
                    onClick={() => {
                      const ordering = [...puzzle.ordering];
                      ordering.splice(idx, 1);
                      patchPuzzle({ ordering, orderingCorrect: ordering });
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                className="btn text-xs"
                onClick={() => {
                  const ordering = [...(puzzle.ordering || []), "Nouvel élément"];
                  patchPuzzle({ ordering, orderingCorrect: ordering });
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter
              </button>
              <div className="text-xs text-slate-500">L'ordre saisi ici sert d'ordre <b>correct</b> ; il sera mélangé côté joueur.</div>
            </div>
          )}

          {puzzle.type === "hotspot" && (
            <div className="space-y-2">
              <label className="label">URL de l'image</label>
              <input
                className="input"
                value={puzzle.hotspots?.image || ""}
                onChange={(e) => patchHotspots({ image: e.target.value })}
                placeholder="https://image..."
              />
              <label className="label">Zones (x, y, largeur, hauteur en %) + correct</label>
              {(puzzle.hotspots?.targets || []).map((target, idx) => (
                <div key={idx} className="grid grid-cols-5 items-center gap-2">
                  {["x", "y", "w", "h"].map((field) => (
                    <input
                      key={field}
                      className="input"
                      type="number"
                      aria-label={`Zone ${idx + 1} : ${field}`}
                      value={target[field]}
                      placeholder={`${field}%`}
                      onChange={(e) => {
                        const targets = [...(puzzle.hotspots?.targets || [])];
                        targets[idx] = { ...target, [field]: parseFloat(e.target.value) || 0 };
                        patchHotspots({ targets });
                      }}
                    />
                  ))}
                  <label className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-amber-400"
                      checked={!!target.correct}
                      onChange={(e) => {
                        const targets = [...(puzzle.hotspots?.targets || [])];
                        targets[idx] = { ...target, correct: e.target.checked };
                        patchHotspots({ targets });
                      }}
                    />
                    Correct
                  </label>
                </div>
              ))}
              <button
                className="btn text-xs"
                onClick={() =>
                  patchHotspots({
                    targets: [...(puzzle.hotspots?.targets || []), { x: 10, y: 10, w: 20, h: 20, correct: true }],
                  })
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter zone
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="label">Indice (optionnel)</label>
          <textarea
            className="input"
            rows={3}
            value={puzzle.hint || ""}
            onChange={(e) => patchPuzzle({ hint: e.target.value })}
          />
          <label className="label">Message de réussite</label>
          <textarea
            className="input"
            rows={2}
            value={puzzle.successText || ""}
            placeholder="Bravo !"
            onChange={(e) => patchPuzzle({ successText: e.target.value })}
          />
        </div>
      </div>
      <MediaPreview url={scene.mediaUrl} />
    </motion.div>
  );
}

export default function Editor({ game, setGame, onBack, onPlay, notify }) {
  const fileRef = useRef(null);

  const addScene = () => setGame((g) => ({ ...g, scenes: [...g.scenes, DEFAULT_SCENE()] }));
  const updateScene = (scene) =>
    setGame((g) => ({ ...g, scenes: g.scenes.map((s) => (s.id === scene.id ? scene : s)) }));
  const deleteScene = (id) => setGame((g) => ({ ...g, scenes: g.scenes.filter((s) => s.id !== id) }));
  const duplicateScene = (scene) =>
    setGame((g) => {
      const copy = JSON.parse(JSON.stringify(scene));
      copy.id = makeId();
      copy.title = `${scene.title} (copie)`;
      const idx = g.scenes.findIndex((s) => s.id === scene.id);
      const scenes = [...g.scenes];
      scenes.splice(idx + 1, 0, copy);
      return { ...g, scenes };
    });

  const exportJSON = () => downloadJSON(game, `${slugify(game.meta.title) || "escape-iso26000"}.json`);

  const importJSON = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = normalizeGame(JSON.parse(await readFileAsText(file)));
      if (!data) throw new Error("structure invalide");
      setGame(data);
      notify(`« ${data.meta.title} » importé (${data.scenes.length} scène${data.scenes.length > 1 ? "s" : ""}).`, "success");
    } catch {
      notify("Fichier invalide : le JSON ne correspond pas à un escape game.", "error");
    }
  };

  const resetAll = () => {
    if (window.confirm("Réinitialiser le projet ? Toutes les scènes seront supprimées.")) {
      setGame((g) => ({ meta: g.meta, settings: { timeLimit: 20 }, scenes: [DEFAULT_SCENE()] }));
      notify("Projet réinitialisé.", "info");
    }
  };

  const injectFromBank = () => {
    const newScenes = QUESTION_BANK.map((q, i) => ({
      id: makeId(),
      title: `${i + 1}. ${q.isoTag}`,
      narrative: "Répondez correctement pour progresser.",
      mediaUrl: "",
      isoTag: q.isoTag,
      puzzle: { type: "qcm", question: q.question, options: q.options, hint: q.hint, successText: "Bien joué !" },
    }));
    setGame((g) => ({ ...g, scenes: [...g.scenes, ...newScenes] }));
    notify(`${newScenes.length} QCM ISO 26000 ajoutés.`, "success");
  };

  const shareLink = async () => {
    const url = `${location.origin}${location.pathname}?game=${encodeGameParam(game)}`;
    try {
      await navigator.clipboard.writeText(url);
      notify(
        url.length > 8000
          ? "Lien copié — attention, il est très long : préférez l'export JSON pour ce jeu."
          : "Lien de partage copié dans le presse-papiers !",
        "success"
      );
    } catch {
      window.prompt("Copiez ce lien de partage :", url);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Accueil
        </button>
        <h1 className="text-xl font-bold sm:text-2xl">🛠️ Éditeur de mission</h1>
        <div className="flex-1" />
        <button className="btn btn-primary" onClick={onPlay} disabled={game.scenes.length === 0}>
          <Play className="h-4 w-4" aria-hidden="true" /> Tester le jeu
        </button>
      </header>

      <div className="card grid items-start gap-3 p-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="label">Titre de la mission</label>
          <input
            className="input text-lg font-semibold"
            value={game.meta.title}
            onChange={(e) => setGame((g) => ({ ...g, meta: { ...g.meta, title: e.target.value } }))}
          />
          <input
            className="input"
            value={game.meta.author}
            placeholder="Auteur·rice (optionnel)"
            aria-label="Auteur ou autrice"
            onChange={(e) => setGame((g) => ({ ...g, meta: { ...g.meta, author: e.target.value } }))}
          />
          <label className="mt-1 inline-flex items-center gap-2 text-sm text-slate-300">
            <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Temps limite (min)
            <input
              className="input !w-20"
              type="number"
              min={1}
              max={180}
              value={game.settings.timeLimit}
              onChange={(e) =>
                setGame((g) => ({
                  ...g,
                  settings: { ...g.settings, timeLimit: Math.min(180, Math.max(1, parseInt(e.target.value || "1", 10))) },
                }))
              }
            />
          </label>
        </div>
        <div className="md:col-span-2">
          <label className="label mb-1">Description / synopsis</label>
          <textarea
            className="input"
            rows={4}
            value={game.meta.description}
            onChange={(e) => setGame((g) => ({ ...g, meta: { ...g.meta, description: e.target.value } }))}
          />
        </div>
      </div>

      <div className="card sticky top-2 z-20 flex flex-wrap items-center gap-2 p-3">
        <button className="btn" onClick={addScene}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Ajouter une scène
        </button>
        <button className="btn" onClick={injectFromBank}>
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Banque ISO 26000
        </button>
        <button className="btn" onClick={exportJSON}>
          <Download className="h-4 w-4" aria-hidden="true" /> Exporter JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJSON} />
        <button className="btn" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" aria-hidden="true" /> Importer JSON
        </button>
        <button className="btn" onClick={shareLink}>
          <Share2 className="h-4 w-4" aria-hidden="true" /> Partager
        </button>
        <div className="flex-1" />
        <span className="chip">{game.scenes.length} scène{game.scenes.length > 1 ? "s" : ""}</span>
        <button className="btn btn-danger" onClick={resetAll}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Réinitialiser
        </button>
      </div>

      {game.scenes.length === 0 ? (
        <div className="card border-dashed p-10 text-center text-sm text-slate-400">
          Aucune scène pour le moment. Ajoutez une scène ou injectez la banque de questions ISO 26000.
        </div>
      ) : (
        <AnimatePresence>
          <motion.div layout className="grid gap-4 md:grid-cols-2">
            {game.scenes.map((scene, index) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                index={index}
                onChange={updateScene}
                onDelete={() => deleteScene(scene.id)}
                onDuplicate={() => duplicateScene(scene)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
