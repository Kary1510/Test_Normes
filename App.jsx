import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, Play, Trash2, Save, Clock, BookOpenCheck, HelpCircle, Settings, Plus, Share2, Square } from "lucide-react";

/**
 * ISO 26000 Escape Builder – Packaged (Vite + Tailwind)
 * Types d'énigmes : qcm | codelock | match | ordering | hotspot
 * - ordering : ordonner des éléments
 * - hotspot  : cliquer sur les bonnes zones d'une image
 */

const ISO_26000_TAGS = [
  "Gouvernance de l'organisation",
  "Droits de l'Homme",
  "Relations et conditions de travail",
  "Environnement",
  "Loyauté des pratiques",
  "Questions relatives aux consommateurs",
  "Communautés et développement local",
];

const DEFAULT_SCENE = () => ({
  id: crypto.randomUUID(),
  title: "Nouvelle scène",
  narrative: "Décrivez le contexte narratif…",
  mediaUrl: "",
  isoTag: ISO_26000_TAGS[0],
  puzzle: {
    type: "qcm",
    question: "Question exemple sur ISO 26000",
    options: [
      { id: 1, text: "Option A", correct: false },
      { id: 2, text: "Option B", correct: true },
      { id: 3, text: "Option C", correct: false },
    ],
    answer: "",
    pairs: [
      { left: "Gouvernance", right: "Processus de décision responsable" },
      { left: "Droits de l'Homme", right: "Diligence raisonnable" },
    ],
    ordering: ["Identifier", "Planifier", "Agir", "Évaluer", "Améliorer"],
    orderingCorrect: ["Identifier", "Planifier", "Agir", "Évaluer", "Améliorer"],
    hotspots: { image: "", targets: [{ x: 10, y: 10, w: 20, h: 20, correct: true }] },
    hint: "Pensez aux 7 questions centrales de l'ISO 26000.",
    successText: "Bravo !",
  },
});

const QUESTION_BANK = [
  {
    isoTag: "Gouvernance de l'organisation",
    question: "Quelle est une caractéristique clé d'une gouvernance responsable selon ISO 26000 ?",
    options: [
      { id: 1, text: "Opacité des décisions", correct: false },
      { id: 2, text: "Transparence et redevabilité", correct: true },
      { id: 3, text: "Décisions unilatérales", correct: false },
    ],
    hint: "Pensez au principe de transparence.",
  },
  {
    isoTag: "Environnement",
    question: "Quel outil est central pour maîtriser les impacts environnementaux ?",
    options: [
      { id: 1, text: "La veille météo", correct: false },
      { id: 2, text: "L'analyse du cycle de vie (ACV)", correct: true },
      { id: 3, text: "Le tableau des congés", correct: false },
    ],
    hint: "De l'extraction à la fin de vie.",
  },
  {
    isoTag: "Droits de l'Homme",
    question: "Que recommande ISO 26000 pour prévenir les atteintes aux droits humains ?",
    options: [
      { id: 1, text: "Ignorer la chaîne d'approvisionnement", correct: false },
      { id: 2, text: "Mettre en place une diligence raisonnable", correct: true },
      { id: 3, text: "Confier le sujet au hasard", correct: false },
    ],
    hint: "Identifier et prévenir les risques.",
  },
];

// Local storage hook
const STORAGE_KEY = "iso26000_escape_builder_pack";
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const downloadJSON = (data, filename = "escape_iso26000.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

function Toolbar({ onExport, onImport, onAddScene, onReset, onPlay, onShare }) {
  const fileRef = useRef(null);
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl shadow bg-white sticky top-2 z-20">
      <button className="btn" onClick={onAddScene}><Plus className="w-4 h-4" /> Ajouter une scène</button>
      <button className="btn" onClick={onExport}><Download className="w-4 h-4" /> Exporter JSON</button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
      <button className="btn" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4" /> Importer JSON</button>
      <button className="btn" onClick={onPlay}><Play className="w-4 h-4" /> Tester le jeu</button>
      <button className="btn" onClick={onShare}><Share2 className="w-4 h-4" /> Partager</button>
      <div className="flex-1" />
      <button className="btn bg-red-50 hover:bg-red-100" onClick={onReset}><Trash2 className="w-4 h-4" /> Réinitialiser</button>
      <style>{`
        .btn{ @apply inline-flex items-center gap-2 px-3 py-2 rounded-2xl shadow hover:shadow-md active:scale-[.99] transition; }
        .input{ @apply w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300; }
      `}</style>
    </div>
  );
}

function SceneCard({ scene, onChange, onDelete }) {
  const update = (path, value) => {
    const clone = { ...scene };
    const keys = path.split(".");
    let obj = clone;
    while (keys.length > 1) obj = obj[keys.shift()];
    obj[keys[0]] = value;
    onChange(clone);
  };
  const puzzle = scene.puzzle;
  return (
    <motion.div layout className="bg-white rounded-2xl p-4 shadow space-y-3">
      <div className="flex items-center gap-2">
        <input className="input text-lg font-semibold" value={scene.title} onChange={e=>update("title", e.target.value)} />
        <select className="input" value={scene.isoTag} onChange={e=>update("isoTag", e.target.value)}>
          {ISO_26000_TAGS.map(t=> <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex-1" />
        <button className="btn bg-red-50 hover:bg-red-100" onClick={onDelete}><Trash2 className="w-4 h-4" /> Supprimer</button>
      </div>
      <textarea className="input" rows={3} value={scene.narrative} onChange={e=>update("narrative", e.target.value)} />
      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-3">
          <label className="text-sm font-medium">URL média (image/vidéo) optionnelle</label>
          <input className="input" value={scene.mediaUrl} onChange={e=>update("mediaUrl", e.target.value)} placeholder="https://..." />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type d'énigme :</span>
            <select className="input" value={puzzle.type} onChange={e=>update("puzzle.type", e.target.value)}>
              <option value="qcm">QCM</option>
              <option value="codelock">Code secret</option>
              <option value="match">Associations</option>
              <option value="ordering">Ordonnancement</option>
              <option value="hotspot">Hotspots (image)</option>
            </select>
          </div>

          {puzzle.type === "qcm" && (
            <div className="space-y-2">
              <input className="input" value={puzzle.question} onChange={e=>update("puzzle.question", e.target.value)} />
              {puzzle.options?.map((o, idx)=> (
                <div key={o.id} className="flex items-center gap-2">
                  <input className="input flex-1" value={o.text} onChange={e=>{
                    const opts = [...puzzle.options];
                    opts[idx] = { ...o, text: e.target.value };
                    update("puzzle.options", opts);
                  }} />
                  <label className="inline-flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={o.correct} onChange={e=>{
                      const opts = [...puzzle.options];
                      opts[idx] = { ...o, correct: e.target.checked };
                      update("puzzle.options", opts);
                    }} /> Correct
                  </label>
                  <button className="btn bg-red-50 hover:bg-red-100" onClick={()=>{
                    const opts = puzzle.options.filter(x=> x.id !== o.id);
                    update("puzzle.options", opts);
                  }}>Suppr</button>
                </div>
              ))}
              <button className="btn" onClick={()=>update("puzzle.options", [...(puzzle.options||[]), { id: Date.now(), text: "Nouvelle option", correct: false }])}><Plus className="w-4 h-4" /> Ajouter option</button>
            </div>
          )}

          {puzzle.type === "codelock" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Indice</label>
              <input className="input" value={puzzle.question} onChange={e=>update("puzzle.question", e.target.value)} placeholder="Ex: Additionnez les chiffres..." />
              <label className="text-sm font-medium">Code attendu</label>
              <input className="input" value={puzzle.answer} onChange={e=>update("puzzle.answer", e.target.value)} placeholder="Ex: 26000" />
            </div>
          )}

          {puzzle.type === "match" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Paires à associer</label>
              {puzzle.pairs?.map((p, idx)=> (
                <div key={idx} className="grid grid-cols-2 gap-2">
                  <input className="input" value={p.left} onChange={e=>{
                    const pairs = [...puzzle.pairs]; pairs[idx] = { ...p, left: e.target.value }; update("puzzle.pairs", pairs);
                  }} />
                  <input className="input" value={p.right} onChange={e=>{
                    const pairs = [...puzzle.pairs]; pairs[idx] = { ...p, right: e.target.value }; update("puzzle.pairs", pairs);
                  }} />
                </div>
              ))}
              <button className="btn" onClick={()=>update("puzzle.pairs", [...(puzzle.pairs||[]), { left: "", right: "" }])}><Plus className="w-4 h-4" /> Ajouter paire</button>
            </div>
          )}

          {puzzle.type === "ordering" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Éléments à ordonner (de haut en bas)</label>
              {(puzzle.ordering || []).map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input className="input flex-1" value={it} onChange={e=>{
                    const arr = [...puzzle.ordering]; arr[idx] = e.target.value; update("puzzle.ordering", arr);
                    const corr = [...(puzzle.orderingCorrect || [])]; corr[idx] = e.target.value; update("puzzle.orderingCorrect", corr);
                  }} />
                  <button className="btn" onClick={()=>{
                    const arr = [...puzzle.ordering]; arr.splice(idx,1); update("puzzle.ordering", arr);
                    const corr = [...(puzzle.orderingCorrect||[])]; corr.splice(idx,1); update("puzzle.orderingCorrect", corr);
                  }}>Suppr</button>
                </div>
              ))}
              <button className="btn" onClick={()=>{
                update("puzzle.ordering", [...(puzzle.ordering||[]), "Nouvel élément"]);
                update("puzzle.orderingCorrect", [...(puzzle.orderingCorrect||[]), "Nouvel élément"]);
              }}><Plus className="w-4 h-4" /> Ajouter</button>
              <div className="text-xs text-gray-600">L'ordre actuel sert d'ordre <b>correct</b> par défaut.</div>
            </div>
          )}

          {puzzle.type === "hotspot" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">URL de l'image</label>
              <input className="input" value={puzzle.hotspots?.image || ""} onChange={e=>update("puzzle.hotspots.image", e.target.value)} placeholder="https://image..." />
              <label className="text-sm font-medium">Zones (x,y,w,h en %) + correct</label>
              {(puzzle.hotspots?.targets || []).map((t, idx)=> (
                <div key={idx} className="grid grid-cols-5 gap-2">
                  <input className="input" type="number" value={t.x} onChange={e=>{
                    const arr=[...(puzzle.hotspots.targets||[])]; arr[idx] = { ...t, x: parseFloat(e.target.value) }; update("puzzle.hotspots.targets", arr);
                  }} placeholder="x%" />
                  <input className="input" type="number" value={t.y} onChange={e=>{
                    const arr=[...(puzzle.hotspots.targets||[])]; arr[idx] = { ...t, y: parseFloat(e.target.value) }; update("puzzle.hotspots.targets", arr);
                  }} placeholder="y%" />
                  <input className="input" type="number" value={t.w} onChange={e=>{
                    const arr=[...(puzzle.hotspots.targets||[])]; arr[idx] = { ...t, w: parseFloat(e.target.value) }; update("puzzle.hotspots.targets", arr);
                  }} placeholder="w%" />
                  <input className="input" type="number" value={t.h} onChange={e=>{
                    const arr=[...(puzzle.hotspots.targets||[])]; arr[idx] = { ...t, h: parseFloat(e.target.value) }; update("puzzle.hotspots.targets", arr);
                  }} placeholder="h%" />
                  <label className="inline-flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={!!t.correct} onChange={e=>{
                      const arr=[...(puzzle.hotspots.targets||[])]; arr[idx] = { ...t, correct: e.target.checked }; update("puzzle.hotspots.targets", arr);
                    }} /> Correct
                  </label>
                </div>
              ))}
              <button className="btn" onClick={()=>{
                const arr=[...(puzzle.hotspots?.targets||[])]; arr.push({ x: 10, y: 10, w: 20, h: 20, correct: true });
                update("puzzle.hotspots.targets", arr);
              }}><Plus className="w-4 h-4" /> Ajouter zone</button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Indice (optionnel)</label>
          <textarea className="input" rows={3} value={puzzle.hint||""} onChange={e=>update("puzzle.hint", e.target.value)} />
          <label className="text-sm font-medium">Message de réussite</label>
          <textarea className="input" rows={2} value={puzzle.successText||"Bravo !"} onChange={e=>update("puzzle.successText", e.target.value)} />
        </div>
      </div>

      {scene.mediaUrl && (
        <div className="rounded-xl overflow-hidden">
          {scene.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video controls className="w-full max-h-72 object-cover">
              <source src={scene.mediaUrl} />
            </video>
          ) : (
            <img src={scene.mediaUrl} alt="media" className="w-full max-h-72 object-cover" />
          )}
        </div>
      )}
    </motion.div>
  );
}

function Runner({ game, onExit }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(game.settings.timeLimit * 60);
  const [status, setStatus] = useState("running");
  const [answers, setAnswers] = useState({});

  const scene = game.scenes[index];
  const total = game.scenes.length;

  useEffect(() => {
    if (status !== "running") return;
    if (timeLeft <= 0) { setStatus("finished"); return; }
    const t = setTimeout(()=> setTimeLeft(t=>t-1), 1000);
    return ()=> clearTimeout(t);
  }, [status, timeLeft]);

  const handleValidate = () => {
    const p = scene.puzzle;
    let ok = false;
    if (p.type === "qcm") {
      const chosen = answers[scene.id]?.qcm ?? [];
      const expected = p.options.filter(o=>o.correct).map(o=>o.id).sort().join(",");
      const got = [...chosen].sort().join(",");
      ok = expected === got;
    } else if (p.type === "codelock") {
      const input = (answers[scene.id]?.code || "").trim();
      ok = input.length > 0 && input.toLowerCase() === (p.answer||"").trim().toLowerCase();
    } else if (p.type === "match") {
      const pairs = answers[scene.id]?.pairs || [];
      ok = pairs.length === p.pairs.length && pairs.every((pair, i)=> pair.right === p.pairs[i].right);
    } else if (p.type === "ordering") {
      const arr = answers[scene.id]?.ordering || [];
      ok = JSON.stringify(arr) === JSON.stringify(p.orderingCorrect || p.ordering);
    } else if (p.type === "hotspot") {
      const clicks = answers[scene.id]?.hotspots || [];
      const correctZones = (p.hotspots?.targets||[]).filter(z=>z.correct).length;
      ok = clicks.filter(c=>c.correct).length === correctZones && clicks.length === correctZones;
    }
    if (ok) {
      setScore(s=> s + 100);
      if (index < total - 1) setIndex(i=> i+1); else setStatus("finished");
      alert(p.successText || "Bravo !");
    } else {
      setScore(s=> Math.max(0, s - 20));
      alert("Réponse incorrecte. Essayez encore !");
    }
  };

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="fixed inset-0 bg-gray-50/90 backdrop-blur-sm flex flex-col z-50">
      <div className="p-3 flex items-center gap-2">
        <button className="btn" onClick={onExit}><Square className="w-4 h-4" /> Quitter</button>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white shadow"><Clock className="w-4 h-4" /> {mm}:{ss}</div>
        <div className="flex-1" />
        <div className="px-3 py-1 rounded-xl bg-white shadow">Score: <b>{score}</b></div>
        <div className="px-3 py-1 rounded-xl bg-white shadow">Scène: <b>{index+1}/{total}</b></div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <motion.div layout className="max-w-5xl mx-auto bg-white rounded-2xl p-6 shadow space-y-4">
          <h2 className="text-2xl font-bold">{scene.title}</h2>
          <div className="text-gray-600 flex items-center gap-2 text-sm"><BookOpenCheck className="w-4 h-4" /> {scene.isoTag}</div>
          <p className="leading-relaxed">{scene.narrative}</p>
          {scene.mediaUrl && (
            <div className="rounded-xl overflow-hidden">
              {scene.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video controls className="w-full max-h-96 object-cover"><source src={scene.mediaUrl} /></video>
              ) : (
                <img src={scene.mediaUrl} alt="media" className="w-full max-h-96 object-cover" />
              )}
            </div>
          )}

          <div className="space-y-3">
            {scene.puzzle.type === "qcm" && (
              <div className="space-y-2">
                <div className="font-medium">{scene.puzzle.question}</div>
                {scene.puzzle.options.map((o)=> (
                  <label key={o.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={answers[scene.id]?.qcm?.includes(o.id) || false} onChange={e=>{
                      const prev = answers[scene.id]?.qcm || [];
                      const next = e.target.checked ? [...prev, o.id] : prev.filter(x=>x!==o.id);
                      setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], qcm: next }}));
                    }} />
                    <span>{o.text}</span>
                  </label>
                ))}
              </div>
            )}

            {scene.puzzle.type === "codelock" && (
              <div className="space-y-2">
                <div className="font-medium">{scene.puzzle.question}</div>
                <input className="input" placeholder="Entrez le code" value={answers[scene.id]?.code || ""} onChange={e=> setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], code: e.target.value }}))} />
              </div>
            )}

            {scene.puzzle.type === "match" && (
              <MatchRunner scene={scene} answers={answers} setAnswers={setAnswers} />
            )}

            {scene.puzzle.type === "ordering" && (
              <OrderingRunner scene={scene} answers={answers} setAnswers={setAnswers} />
            )}

            {scene.puzzle.type === "hotspot" && (
              <HotspotRunner scene={scene} answers={answers} setAnswers={setAnswers} />
            )}

            <div className="flex items-center gap-2">
              {scene.puzzle.hint && <div className="text-sm text-gray-600 inline-flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {scene.puzzle.hint}</div>}
              <div className="flex-1" />
              <button className="btn" onClick={handleValidate}><Save className="w-4 h-4" /> Valider</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MatchRunner({ scene, answers, setAnswers }) {
  const rights = useMemo(()=> scene.puzzle.pairs.map(p=>p.right).sort(()=> Math.random()-0.5), [scene.id]);
  const current = answers[scene.id]?.pairs || scene.puzzle.pairs.map(p=> ({ left: p.left, right: "" }));

  const updateRight = (idx, value) => {
    const next = [...current];
    next[idx] = { ...next[idx], right: value };
    setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], pairs: next }}));
  };

  return (
    <div className="space-y-2">
      {current.map((pair, idx)=> (
        <div key={idx} className="grid grid-cols-2 gap-2 items-center">
          <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">{pair.left}</div>
          <select className="input" value={pair.right} onChange={e=> updateRight(idx, e.target.value)}>
            <option value="">— Associer —</option>
            {rights.map((r,i)=> <option key={i} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function OrderingRunner({ scene, answers, setAnswers }) {
  const init = useMemo(()=> (scene.puzzle.ordering || []).slice().sort(()=> Math.random()-0.5), [scene.id]);
  const list = answers[scene.id]?.ordering || init;

  const move = (idx, dir) => {
    const next = [...list];
    const ni = idx + dir;
    if (ni < 0 || ni >= next.length) return;
    const [sp] = next.splice(idx,1);
    next.splice(ni,0,sp);
    setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], ordering: next }}));
  };

  useEffect(()=>{
    // initialize once
    if (!answers[scene.id]?.ordering) {
      setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], ordering: init }}));
    }
  // eslint-disable-next-line
  }, []);

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Réorganisez dans le bon ordre.</div>
      {list.map((item, idx)=> (
        <div key={item+idx} className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">{item}</div>
          <button className="btn" onClick={()=> move(idx,-1)}>↑</button>
          <button className="btn" onClick={()=> move(idx, 1)}>↓</button>
        </div>
      ))}
    </div>
  );
}

function HotspotRunner({ scene, answers, setAnswers }) {
  const { image, targets=[] } = scene.puzzle.hotspots || {};
  const clicks = answers[scene.id]?.hotspots || [];

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    // check if within any target
    const match = targets.find(t => xPct >= t.x && xPct <= t.x + t.w && yPct >= t.y && yPct <= t.y + t.h);
    const entry = match ? { x: xPct, y: yPct, correct: !!match.correct } : { x: xPct, y: yPct, correct: false };
    const already = clicks.find(c=> Math.abs(c.x - entry.x) < 2 && Math.abs(c.y - entry.y) < 2);
    if (already) return;
    setAnswers(a=> ({...a, [scene.id]: {...a[scene.id], hotspots: [...(clicks||[]), entry] }}));
  };

  return (
    <div className="space-y-2">
      {!image && <div className="text-sm text-red-600">Ajoutez l'URL d'une image dans l'éditeur.</div>}
      {image && (
        <div className="relative w-full max-w-2xl">
          <img src={image} alt="hotspot" className="w-full rounded-xl border border-gray-200" onClick={handleClick} />
          {/* show markers */}
          {clicks.map((c,i)=>(
            <div key={i} className={"absolute w-3 h-3 rounded-full border-2"} style={{ left: `calc(${c.x}% - 6px)`, top: `calc(${c.y}% - 6px)`, borderColor: c.correct ? "green" : "red", background: "white" }} />
          ))}
        </div>
      )}
      <div className="text-xs text-gray-600">Cliquez sur l'image pour sélectionner les zones pertinentes.</div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useLocalStorage(STORAGE_KEY, {
    meta: {
      title: "Escape Game – ISO 26000",
      description: "Sensibilisation à la responsabilité sociétale (ISO 26000) via un jeu d'énigmes.",
      author: "",
    },
    settings: { timeLimit: 20 },
    scenes: [DEFAULT_SCENE()],
  });
  const [mode, setMode] = useState("edit");

  const addScene = () => setGame(g=> ({...g, scenes: [...g.scenes, DEFAULT_SCENE()]}));
  const updateScene = (scene) => setGame(g=> ({...g, scenes: g.scenes.map(s=> s.id===scene.id? scene: s)}));
  const deleteScene = (id) => setGame(g=> ({...g, scenes: g.scenes.filter(s=> s.id!==id)}));

  const exportJSON = () => downloadJSON(game, slugify(game.meta.title)+".json");
  const importJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try{
      const text = await readFileAsText(file);
      const data = JSON.parse(text);
      setGame(data);
    }catch(err){ alert("Fichier invalide"); }
  };

  const resetAll = () => {
    if (confirm("Réinitialiser le projet ?")) {
      setGame({ meta: game.meta, settings: { timeLimit: 20 }, scenes: [DEFAULT_SCENE()] });
    }
  };

  const injectFromBank = () => {
    const newScenes = QUESTION_BANK.map((q,i)=> ({
      id: crypto.randomUUID(),
      title: `${i+1}. ${q.isoTag}`,
      narrative: "Répondez correctement pour progresser.",
      mediaUrl: "",
      isoTag: q.isoTag,
      puzzle: { type: "qcm", question: q.question, options: q.options, hint: q.hint, successText: "Bien joué !" }
    }));
    setGame(g=> ({...g, scenes: [...g.scenes, ...newScenes]}));
  };

  const shareLink = () => {
    const payload = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(game)))));
    const url = `${location.origin}${location.pathname}?game=${payload}`;
    navigator.clipboard.writeText(url).then(()=> alert("Lien copié dans le presse-papiers !"));
  };

  useEffect(()=>{
    const params = new URLSearchParams(location.search);
    const raw = params.get("game");
    if (raw) {
      try{
        const data = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));
        setGame(data);
      }catch{}
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="max-w-6xl mx-auto p-4 flex items-center gap-3">
        <div className="text-2xl font-bold">🗝️ ISO 26000 Escape Builder</div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white shadow">
          <Settings className="w-4 h-4" />
          <label>Limite (min) <input className="input w-20" type="number" min={1} max={180} value={game.settings.timeLimit} onChange={(e)=> setGame(g=> ({...g, settings: {...g.settings, timeLimit: parseInt(e.target.value||"0")}}) )} /></label>
        </div>
        <div className="flex-1" />
        <button className="btn" onClick={()=> setMode("play")}><Play className="w-4 h-4" /> Lancer</button>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-3 gap-3 items-center">
          <div>
            <input className="input text-xl font-semibold" value={game.meta.title} onChange={e=> setGame(g=> ({...g, meta: {...g.meta, title: e.target.value}}))} />
            <input className="input mt-2" value={game.meta.author} placeholder="Auteur·rice (optionnel)" onChange={e=> setGame(g=> ({...g, meta: {...g.meta, author: e.target.value}}))} />
          </div>
          <textarea className="input md:col-span-2" rows={2} value={game.meta.description} onChange={e=> setGame(g=> ({...g, meta: {...g.meta, description: e.target.value}}))} />
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <Toolbar
              onExport={exportJSON}
              onImport={importJSON}
              onAddScene={addScene}
              onReset={resetAll}
              onPlay={()=> setMode("play")}
              onShare={shareLink}
            />
            <button className="btn" onClick={injectFromBank}><BookOpenCheck className="w-4 h-4" /> Ajouter des QCM ISO 26000</button>
          </div>
        </div>

        <AnimatePresence>
          <motion.div layout className="grid md:grid-cols-2 gap-4">
            {game.scenes.map(scene=> (
              <SceneCard key={scene.id} scene={scene} onChange={updateScene} onDelete={()=> deleteScene(scene.id)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </main>

      {mode === "play" && (
        <Runner game={game} onExit={()=> setMode("edit")} />
      )}

      <footer className="max-w-6xl mx-auto p-6 text-center text-sm text-gray-500">
        Pack prêt à déployer (Vite + Tailwind). Hébergez sur GitHub Pages, Netlify ou Vercel.
      </footer>
    </div>
  );
}

function slugify(str){
  return (str||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
