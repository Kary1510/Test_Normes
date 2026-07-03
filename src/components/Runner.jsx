// Écran de jeu : briefing de mission, énigmes avec feedback immédiat,
// score/streak/indices, chronomètre, écran de fin avec badges et,
// en multijoueur, classement en direct et podium final.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Crown,
  Lightbulb,
  Loader2,
  LogOut,
  Play,
  RotateCcw,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";
import { formatTime, validatePuzzle } from "../lib/game.js";
import { BADGES, ENCOURAGEMENTS, SCORING } from "../data.js";
import { QcmPuzzle, CodePuzzle, MatchPuzzle, OrderingPuzzle, HotspotPuzzle } from "./puzzles.jsx";

function SceneMedia({ url }) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      {url.match(/\.(mp4|webm|ogg)$/i) ? (
        <video controls className="max-h-96 w-full object-cover">
          <source src={url} />
        </video>
      ) : (
        <img src={url} alt="Illustration de la scène" className="max-h-96 w-full object-cover" />
      )}
    </div>
  );
}

// Classement des joueurs, trié par score puis par progression.
function Standings({ players, selfId, total, compact = false }) {
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.score - a.score || b.sceneIndex - a.sceneIndex),
    [players]
  );
  if (compact) {
    return (
      <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center gap-1.5">
        {sorted.map((p, i) => (
          <span
            key={p.id}
            className={`chip !py-0.5 ${p.id === selfId ? "!border-amber-400/60 !text-amber-200" : ""}`}
          >
            {i === 0 && <Crown className="h-3 w-3 text-amber-400" aria-hidden="true" />}
            {p.name} · {p.score} pts · {p.finished ? "✓ terminé" : `${Math.min(p.sceneIndex + 1, total)}/${total}`}
          </span>
        ))}
      </div>
    );
  }
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <ol className="space-y-2">
      {sorted.map((p, i) => (
        <li
          key={p.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm
            ${p.id === selfId ? "border-amber-400/60 bg-amber-400/10" : "border-slate-700 bg-slate-900/70"}`}
        >
          <span className="w-8 text-center text-lg" aria-hidden="true">
            {medals[i] || `${i + 1}.`}
          </span>
          <span className="flex-1 font-medium">
            {p.name}
            {p.id === selfId && <span className="ml-2 text-xs text-amber-300">(vous)</span>}
            {p.isHost && <span className="ml-2 text-xs text-slate-500">hôte</span>}
          </span>
          <span className="text-xs text-slate-400">
            {p.finished ? "Terminé" : `Scène ${Math.min(p.sceneIndex + 1, total)}/${total}`}
          </span>
          <span className="font-bold text-amber-300">{p.score} pts</span>
        </li>
      ))}
    </ol>
  );
}

function FeedbackOverlay({ feedback }) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.85, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={`card w-full max-w-sm border-2 px-6 py-6 text-center space-y-2
              ${feedback.type === "success" ? "!border-emerald-500/70" : "!border-rose-500/70"}`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden="true" />
            ) : (
              <XCircle className="mx-auto h-12 w-12 text-rose-400" aria-hidden="true" />
            )}
            <div className="text-lg font-bold">{feedback.title}</div>
            {feedback.text && <div className="text-sm text-slate-300">{feedback.text}</div>}
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold
                ${feedback.points > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}
            >
              {feedback.points > 0 ? `+${feedback.points}` : feedback.points} pts
              {feedback.streak >= 2 && <span>🔥 série de {feedback.streak}</span>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Runner({ game, mode = "solo", roomState, selfId, onProgress, onExit, onReplay }) {
  const scenes = game.scenes;
  const total = scenes.length;
  const totalTime = Math.max(1, game.settings?.timeLimit || 20) * 60;

  // En multijoueur, tout le monde démarre en même temps que l'hôte : pas de briefing.
  const [phase, setPhase] = useState(mode === "multi" ? "playing" : "briefing");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [sceneStats, setSceneStats] = useState({});
  const [totalErrors, setTotalErrors] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [revealedHints, setRevealedHints] = useState({});
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finishReason, setFinishReason] = useState(null); // completed | timeout
  const [finalScore, setFinalScore] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);

  const timeLeftRef = useRef(totalTime);
  const errorsRef = useRef(0);
  const advanceTimerRef = useRef(null);

  const scene = scenes[index];

  useEffect(() => () => clearTimeout(advanceTimerRef.current), []);

  // Chronomètre
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && timeLeft <= 0) {
      clearTimeout(advanceTimerRef.current);
      setFeedback(null);
      finish("timeout", score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const finish = (reason, baseScore) => {
    const bonus =
      reason === "completed"
        ? Math.floor(Math.max(0, timeLeftRef.current) / 60) * SCORING.TIME_BONUS_PER_MINUTE
        : 0;
    setTimeBonus(bonus);
    setFinalScore(baseScore + bonus);
    setFinishReason(reason);
    setPhase("finished");
    onProgress?.({ score: baseScore + bonus, sceneIndex: total, errors: errorsRef.current, finished: true });
  };

  const setSceneAnswer = (patch) =>
    setAnswers((a) => ({ ...a, [scene.id]: { ...a[scene.id], ...patch } }));

  const revealHint = () => {
    if (revealedHints[scene.id]) return;
    setRevealedHints((r) => ({ ...r, [scene.id]: true }));
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - SCORING.HINT_COST));
    setSceneStats((s) => ({
      ...s,
      [scene.id]: { attempts: 0, solved: false, points: 0, ...s[scene.id], hintUsed: true },
    }));
  };

  const handleValidate = () => {
    if (feedback || phase !== "playing") return;
    const stats = sceneStats[scene.id] || { attempts: 0, hintUsed: false, solved: false, points: 0 };
    const ok = validatePuzzle(scene.puzzle, answers[scene.id]);

    if (ok) {
      const firstTry = stats.attempts === 0;
      const newStreak = firstTry ? streak + 1 : 0;
      const gained = SCORING.BASE_POINTS + (newStreak >= 2 ? SCORING.STREAK_BONUS : 0);
      const newScore = score + gained;
      const isLast = index >= total - 1;
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setSceneStats((s) => ({ ...s, [scene.id]: { ...stats, solved: true, points: gained } }));
      setFeedback({
        type: "success",
        title: scene.puzzle.successText || "Bravo !",
        points: gained,
        streak: newStreak,
      });
      if (!isLast) {
        onProgress?.({ score: newScore, sceneIndex: index + 1, errors: errorsRef.current, finished: false });
      }
      advanceTimerRef.current = setTimeout(() => {
        setFeedback(null);
        if (isLast) finish("completed", newScore);
        else setIndex(index + 1);
      }, 1600);
    } else {
      const newScore = Math.max(0, score - SCORING.ERROR_PENALTY);
      errorsRef.current += 1;
      setScore(newScore);
      setStreak(0);
      setTotalErrors(errorsRef.current);
      setSceneStats((s) => ({ ...s, [scene.id]: { ...stats, attempts: stats.attempts + 1 } }));
      setFeedback({
        type: "error",
        title: "Réponse incorrecte",
        text: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
        points: -SCORING.ERROR_PENALTY,
      });
      onProgress?.({ score: newScore, sceneIndex: index, errors: errorsRef.current, finished: false });
      advanceTimerRef.current = setTimeout(() => setFeedback(null), 1800);
    }
  };

  const confirmExit = () => {
    if (phase === "playing" && !window.confirm("Quitter la partie en cours ?")) return;
    onExit();
  };

  // L'hôte a fermé son onglet : la partie ne peut plus continuer.
  if (mode === "multi" && roomState?.status === "ended") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-md space-y-4 p-8 text-center">
          <div className="text-4xl" aria-hidden="true">🔌</div>
          <h1 className="text-xl font-bold">L'hôte a quitté la partie</h1>
          <p className="text-sm text-slate-400">La session multijoueur est terminée.</p>
          <button className="btn btn-primary w-full" onClick={onExit}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ---------- Briefing ----------
  if (phase === "briefing") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="card w-full max-w-2xl space-y-6 p-6 text-center sm:p-10"
        >
          <div className="animate-float text-6xl motion-reduce:animate-none" aria-hidden="true">🗝️</div>
          <div className="space-y-2">
            <span className="chip !border-amber-400/40 !text-amber-300">Briefing de mission</span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{game.meta.title}</h1>
            {game.meta.description && (
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300">{game.meta.description}</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="chip">🧩 {total} énigme{total > 1 ? "s" : ""}</span>
            <span className="chip">⏱ {game.settings?.timeLimit || 20} min</span>
            <span className="chip">🎯 ISO 26000</span>
          </div>
          <ul className="mx-auto max-w-md space-y-1.5 text-left text-sm text-slate-300">
            <li>✅ Chaque énigme résolue rapporte <b>{SCORING.BASE_POINTS} pts</b> (+{SCORING.STREAK_BONUS} pts en série).</li>
            <li>❌ Une erreur coûte <b>{SCORING.ERROR_PENALTY} pts</b>, un indice révélé <b>{SCORING.HINT_COST} pts</b>.</li>
            <li>⚡ Terminez vite : chaque minute restante offre un bonus de temps.</li>
          </ul>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <button className="btn btn-primary px-8 py-3 text-base" onClick={() => setPhase("playing")}>
              <Play className="h-5 w-5" /> Commencer la mission
            </button>
            <button className="btn btn-ghost" onClick={onExit}>
              Retour
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- Écran de fin ----------
  if (phase === "finished") {
    const completed = finishReason === "completed";
    const maxScore = total * SCORING.BASE_POINTS;
    const ratio = maxScore > 0 ? finalScore / maxScore : 0;
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : ratio >= 0.25 ? 1 : 0;
    const result = {
      completed,
      errors: totalErrors,
      hintsUsed,
      timeLeft: Math.max(0, timeLeft),
      totalTime,
      bestStreak,
    };
    const waitingOthers = mode === "multi" && roomState?.status === "playing";
    const multiFinished = mode === "multi" && roomState?.status === "finished";

    return (
      <div className="flex min-h-screen items-start justify-center p-4 py-8 sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="card w-full max-w-2xl space-y-6 p-6 sm:p-10"
        >
          <div className="space-y-3 text-center">
            {completed ? (
              <Trophy className="mx-auto h-14 w-14 text-amber-400" aria-hidden="true" />
            ) : (
              <Clock className="mx-auto h-14 w-14 text-rose-400" aria-hidden="true" />
            )}
            <h1 className="text-3xl font-extrabold">
              {completed ? "Mission accomplie !" : "Temps écoulé !"}
            </h1>
            <p className="text-sm text-slate-400">
              {completed
                ? "Vous vous êtes échappé·e avec les preuves. La responsabilité sociétale n'a plus de secret pour vous."
                : "La sécurité vous a repéré·e… mais chaque tentative vous rapproche de la sortie. Retentez votre chance !"}
            </p>
            <div className="flex justify-center gap-1" aria-label={`${stars} étoile${stars > 1 ? "s" : ""} sur 3`}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 260 }}
                >
                  <Star
                    className={`h-9 w-9 ${i < stars ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                    aria-hidden="true"
                  />
                </motion.span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
            <div className="text-xs uppercase tracking-widest text-slate-500">Score final</div>
            <div className="text-5xl font-extrabold text-amber-300">{finalScore}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
              <div>🧩 {Object.values(sceneStats).filter((s) => s.solved).length}/{total} résolues</div>
              <div>❌ {totalErrors} erreur{totalErrors > 1 ? "s" : ""}</div>
              <div>💡 {hintsUsed} indice{hintsUsed > 1 ? "s" : ""}</div>
              <div>⚡ Bonus temps : +{timeBonus}</div>
            </div>
          </div>

          <div>
            <h2 className="label mb-2">Trophées</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BADGES.map((badge) => {
                const earned = badge.test(result);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl border p-3 text-center transition
                      ${earned ? "border-amber-400/50 bg-amber-400/5" : "border-slate-800 opacity-40 grayscale"}`}
                    title={badge.description}
                  >
                    <div className="text-2xl" aria-hidden="true">{badge.icon}</div>
                    <div className="mt-1 text-xs font-semibold">{badge.label}</div>
                    <div className="mt-0.5 text-[10px] leading-tight text-slate-500">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="label mb-2">Détail des énigmes</h2>
            <ul className="space-y-1.5">
              {scenes.map((s, i) => {
                const st = sceneStats[s.id];
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm"
                  >
                    {st?.solved ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                    )}
                    <span className="flex-1 truncate">{i + 1}. {s.title}</span>
                    {st?.hintUsed && <span title="Indice utilisé">💡</span>}
                    {st?.attempts > 0 && (
                      <span className="text-xs text-slate-500">{st.attempts} erreur{st.attempts > 1 ? "s" : ""}</span>
                    )}
                    <span className={`text-xs font-bold ${st?.solved ? "text-emerald-300" : "text-slate-600"}`}>
                      {st?.solved ? `+${st.points}` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {waitingOthers && (
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400" aria-hidden="true" />
              <div className="text-sm text-slate-300">En attente des autres joueurs…</div>
              <Standings players={roomState.players} selfId={selfId} total={total} />
            </div>
          )}

          {multiFinished && (
            <div className="space-y-3">
              <h2 className="label">🏆 Classement final</h2>
              <Standings players={roomState.players} selfId={selfId} total={total} />
            </div>
          )}

          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            {mode === "solo" && (
              <button className="btn btn-primary px-6" onClick={onReplay}>
                <RotateCcw className="h-4 w-4" /> Rejouer
              </button>
            )}
            <button className="btn" onClick={onExit}>
              <LogOut className="h-4 w-4" /> Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- Partie en cours ----------
  const lowTime = timeLeft <= 60;
  const progress = total > 0 ? (index / total) * 100 : 0;
  const hintRevealed = !!revealedHints[scene.id];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/85 px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 sm:gap-3">
          <button className="btn btn-ghost !px-3" onClick={confirmExit}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
          <span
            className={`chip tabular-nums ${lowTime ? "!border-rose-500/60 !text-rose-300 animate-pulse motion-reduce:animate-none" : ""}`}
            role="timer"
            aria-label={`Temps restant : ${formatTime(timeLeft)}`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatTime(timeLeft)}
          </span>
          <div className="min-w-[60px] flex-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={index}
              aria-label="Progression de la mission"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="chip">🏆 {score} pts</span>
          <span className="chip">🧩 {index + 1}/{total}</span>
        </div>
        {mode === "multi" && roomState && (
          <Standings players={roomState.players} selfId={selfId} total={total} compact />
        )}
      </header>

      <main className="flex-1 overflow-auto px-3 py-4 sm:px-4 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-3xl"
          >
            <div key={`shake-${totalErrors}`} className={feedback?.type === "error" ? "animate-shake motion-reduce:animate-none" : ""}>
              <div className="card space-y-5 p-5 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip !border-emerald-500/40 !text-emerald-300">
                    <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" /> {scene.isoTag}
                  </span>
                  <span className="chip">Étape {index + 1} sur {total}</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{scene.title}</h2>
                {scene.narrative && <p className="leading-relaxed text-slate-300">{scene.narrative}</p>}
                <SceneMedia url={scene.mediaUrl} />

                {scene.puzzle.type === "qcm" && (
                  <QcmPuzzle scene={scene} answer={answers[scene.id]} setAnswer={setSceneAnswer} />
                )}
                {scene.puzzle.type === "codelock" && (
                  <CodePuzzle scene={scene} answer={answers[scene.id]} setAnswer={setSceneAnswer} onSubmit={handleValidate} />
                )}
                {scene.puzzle.type === "match" && (
                  <MatchPuzzle scene={scene} answer={answers[scene.id]} setAnswer={setSceneAnswer} />
                )}
                {scene.puzzle.type === "ordering" && (
                  <OrderingPuzzle scene={scene} answer={answers[scene.id]} setAnswer={setSceneAnswer} />
                )}
                {scene.puzzle.type === "hotspot" && (
                  <HotspotPuzzle scene={scene} answer={answers[scene.id]} setAnswer={setSceneAnswer} />
                )}

                <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center">
                  {scene.puzzle.hint &&
                    (hintRevealed ? (
                      <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-sm text-amber-200">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {scene.puzzle.hint}
                      </div>
                    ) : (
                      <button className="btn btn-ghost text-amber-300" onClick={revealHint}>
                        <Lightbulb className="h-4 w-4" aria-hidden="true" /> Révéler l'indice (−{SCORING.HINT_COST} pts)
                      </button>
                    ))}
                  <div className="flex-1" />
                  <button
                    className="btn btn-primary px-8 py-3"
                    onClick={handleValidate}
                    disabled={!!feedback}
                  >
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Valider
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <FeedbackOverlay feedback={feedback} />
    </div>
  );
}
