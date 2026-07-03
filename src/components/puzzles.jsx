// Composants d'énigmes côté joueur. Chaque composant reçoit la scène,
// la réponse en cours et un setter qui fusionne un patch dans la réponse
// de la scène : setAnswer({ qcm: [...] }).
import React, { useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp, Check, Eraser, KeyRound } from "lucide-react";
import { shuffle } from "../lib/game.js";

export function QcmPuzzle({ scene, answer, setAnswer }) {
  const chosen = answer?.qcm || [];
  const toggle = (id) =>
    setAnswer({ qcm: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] });

  return (
    <div className="space-y-2">
      <div className="font-medium text-slate-100">{scene.puzzle.question}</div>
      <div className="grid gap-2">
        {(scene.puzzle.options || []).map((option) => {
          const selected = chosen.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(option.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                ${selected
                  ? "border-amber-400/80 bg-amber-400/10 text-amber-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80"}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition
                  ${selected ? "border-amber-400 bg-amber-400 text-slate-950" : "border-slate-600"}`}
                aria-hidden="true"
              >
                {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Plusieurs réponses peuvent être correctes.</p>
    </div>
  );
}

export function CodePuzzle({ scene, answer, setAnswer, onSubmit }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="font-medium text-slate-100">{scene.puzzle.question}</div>
      <div className="relative max-w-xs">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400/80" aria-hidden="true" />
        <input
          className="input pl-9 font-mono text-lg tracking-[0.3em]"
          placeholder="CODE"
          aria-label="Code secret"
          autoComplete="off"
          value={answer?.code || ""}
          onChange={(e) => setAnswer({ code: e.target.value })}
        />
      </div>
      <p className="text-xs text-slate-500">Appuyez sur Entrée ou sur « Valider » pour tester le code.</p>
    </form>
  );
}

export function MatchPuzzle({ scene, answer, setAnswer }) {
  // Les propositions de droite sont mélangées une fois par scène.
  const rights = useMemo(
    () => shuffle((scene.puzzle.pairs || []).map((p) => p.right)),
    [scene.id] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const current = answer?.pairs || (scene.puzzle.pairs || []).map((p) => ({ left: p.left, right: "" }));

  const updateRight = (idx, value) => {
    const next = [...current];
    next[idx] = { ...next[idx], right: value };
    setAnswer({ pairs: next });
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-400">Associez chaque élément à sa bonne définition.</div>
      {current.map((pair, idx) => (
        <div key={idx} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-medium text-slate-100">
            {pair.left}
          </div>
          <select
            className="input"
            aria-label={`Association pour ${pair.left}`}
            value={pair.right}
            onChange={(e) => updateRight(idx, e.target.value)}
          >
            <option value="">— Associer —</option>
            {rights.map((r, i) => (
              <option key={i} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function OrderingPuzzle({ scene, answer, setAnswer }) {
  const initial = useMemo(
    () => shuffle(scene.puzzle.ordering || []),
    [scene.id] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const list = answer?.ordering || initial;

  // Enregistre l'ordre mélangé initial pour que la validation porte
  // toujours sur ce que le joueur voit.
  useEffect(() => {
    if (!answer?.ordering) setAnswer({ ordering: initial });
  }, [scene.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    setAnswer({ ordering: next });
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-400">Réorganisez les étapes dans le bon ordre (de haut en bas).</div>
      {list.map((item, idx) => (
        <div key={item + idx} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-center text-xs font-bold text-slate-500">{idx + 1}</span>
          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm text-slate-100">
            {item}
          </div>
          <button className="btn !px-2.5" aria-label={`Monter « ${item} »`} disabled={idx === 0} onClick={() => move(idx, -1)}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            className="btn !px-2.5"
            aria-label={`Descendre « ${item} »`}
            disabled={idx === list.length - 1}
            onClick={() => move(idx, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function HotspotPuzzle({ scene, answer, setAnswer }) {
  const { image, targets = [] } = scene.puzzle.hotspots || {};
  const clicks = answer?.hotspots || [];
  const zonesToFind = targets.filter((t) => t.correct).length;
  const found = clicks.filter((c) => c.correct).length;

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const match = targets.find((t) => xPct >= t.x && xPct <= t.x + t.w && yPct >= t.y && yPct <= t.y + t.h);
    const entry = { x: xPct, y: yPct, correct: !!match?.correct };
    const already = clicks.find((c) => Math.abs(c.x - entry.x) < 2 && Math.abs(c.y - entry.y) < 2);
    if (already) return;
    setAnswer({ hotspots: [...clicks, entry] });
  };

  return (
    <div className="space-y-2">
      {!image && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Aucune image configurée pour cette énigme. Ajoutez une URL d'image dans l'éditeur.
        </div>
      )}
      {image && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">🎯 Zones à trouver : {zonesToFind}</span>
            <span className="chip">Trouvées : {found}/{zonesToFind}</span>
            {clicks.length > 0 && (
              <button className="btn btn-ghost !py-1 text-xs" onClick={() => setAnswer({ hotspots: [] })}>
                <Eraser className="h-3.5 w-3.5" /> Effacer les sélections
              </button>
            )}
          </div>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700">
            <img src={image} alt="Image de l'énigme : cliquez sur les zones pertinentes" className="w-full cursor-crosshair" onClick={handleClick} />
            {clicks.map((c, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`absolute h-4 w-4 rounded-full border-2 bg-white/90 shadow ${c.correct ? "border-emerald-500" : "border-rose-500"}`}
                style={{ left: `calc(${c.x}% - 8px)`, top: `calc(${c.y}% - 8px)` }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">Cliquez sur l'image pour marquer les zones pertinentes, puis validez.</p>
        </>
      )}
    </div>
  );
}
