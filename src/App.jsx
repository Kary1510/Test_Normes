// Coquille de l'application : écran d'accueil, navigation entre les vues
// (éditeur, règles, multijoueur, partie), import des liens partagés, toasts.
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Hammer, Play, Users } from "lucide-react";
import Editor from "./components/Editor.jsx";
import HowToPlay from "./components/HowToPlay.jsx";
import Lobby from "./components/Lobby.jsx";
import Runner from "./components/Runner.jsx";
import { DEMO_GAME } from "./data.js";
import { normalizeGame } from "./lib/game.js";
import { useRoom } from "./lib/multiplayer.js";
import { STORAGE_KEY, decodeGameParam, useLocalStorage } from "./lib/storage.js";

function Toast({ toast }) {
  const styles = {
    success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-500/50 bg-rose-500/10 text-rose-200",
    info: "border-slate-600 bg-slate-800/90 text-slate-200",
  };
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-center text-sm shadow-xl backdrop-blur ${styles[toast.kind] || styles.info}`}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Home({ game, onNavigate, onPlaySolo }) {
  const sceneCount = game.scenes.length;
  const actions = [
    {
      icon: Play,
      title: "Jouer en solo",
      text: "Lancez la mission et battez votre record.",
      primary: true,
      disabled: sceneCount === 0,
      onClick: onPlaySolo,
    },
    {
      icon: Users,
      title: "Multijoueur",
      text: "Créez une partie ou rejoignez-la avec un code.",
      onClick: () => onNavigate("lobby"),
    },
    {
      icon: Hammer,
      title: "Éditeur de mission",
      text: "Créez vos scènes, énigmes et scénarios.",
      onClick: () => onNavigate("editor"),
    },
    {
      icon: BookOpen,
      title: "Comment jouer",
      text: "Règles, types d'énigmes, score et trophées.",
      onClick: () => onNavigate("howto"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="animate-float text-7xl motion-reduce:animate-none" aria-hidden="true">🗝️</div>
            <div className="space-y-2">
              <span className="chip !border-emerald-500/40 !text-emerald-300">Escape game pédagogique · ISO 26000</span>
              <h1 className="bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                {game.meta.title}
              </h1>
              {game.meta.description && (
                <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                  {game.meta.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="chip">🧩 {sceneCount} énigme{sceneCount > 1 ? "s" : ""}</span>
              <span className="chip">⏱ {game.settings.timeLimit} min</span>
              <span className="chip">🎯 7 questions centrales</span>
              {game.meta.author && <span className="chip">✍️ {game.meta.author}</span>}
            </div>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action, i) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`card group p-5 text-left transition hover:-translate-y-0.5
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                  disabled:opacity-40 disabled:hover:translate-y-0
                  ${action.primary ? "!border-amber-400/40 hover:!border-amber-400/70" : "hover:border-slate-600"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition
                      ${action.primary
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-300 group-hover:bg-amber-400/20"
                        : "border-slate-700 bg-slate-800/80 text-slate-300 group-hover:text-amber-300"}`}
                  >
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="font-semibold">{action.title}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{action.text}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {sceneCount === 0 && (
            <p className="text-xs text-slate-500">
              Cette mission ne contient aucune scène : passez par l'éditeur pour en ajouter.
            </p>
          )}
        </div>
      </main>
      <footer className="p-6 text-center text-xs text-slate-600">
        Vite + React + Tailwind · Déployable sur GitHub Pages, Netlify ou Vercel
      </footer>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useLocalStorage(STORAGE_KEY, DEMO_GAME);
  const [screen, setScreen] = useState("home"); // home | editor | howto | lobby
  const [soloRunId, setSoloRunId] = useState(0); // > 0 : partie solo en cours
  const [toast, setToast] = useState(null);
  const room = useRoom();

  // Le jeu stocké peut venir d'une vieille version ou d'un import : on le
  // normalise systématiquement avant de le jouer.
  const safeGame = useMemo(() => normalizeGame(game) || DEMO_GAME(), [game]);

  const notify = (message, kind = "info") => setToast({ message, kind });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Import d'un jeu via un lien partagé (?game=…), compatible anciens liens.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("game");
    if (!raw) return;
    try {
      const data = normalizeGame(decodeGameParam(raw));
      if (data) {
        setGame(data);
        notify(`Mission « ${data.meta.title} » importée depuis le lien !`, "success");
      }
    } catch {
      notify("Le lien de partage est invalide ou incomplet.", "error");
    }
    history.replaceState(null, "", location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let content;
  const multiState = room.state;

  if (multiState && (multiState.status === "playing" || multiState.status === "finished" || multiState.status === "ended")) {
    // Partie multijoueur en cours : le jeu vient de l'état de la salle (celui de l'hôte).
    const multiGame = normalizeGame(multiState.game) || safeGame;
    content = (
      <Runner
        mode="multi"
        game={multiGame}
        roomState={multiState}
        selfId={room.selfId}
        onProgress={room.reportProgress}
        onExit={() => {
          room.leaveRoom();
          setScreen("home");
        }}
      />
    );
  } else if (soloRunId > 0) {
    content = (
      <Runner
        key={soloRunId}
        mode="solo"
        game={safeGame}
        onExit={() => setSoloRunId(0)}
        onReplay={() => setSoloRunId((id) => id + 1)}
      />
    );
  } else if (screen === "editor") {
    content = (
      <Editor
        game={safeGame}
        setGame={setGame}
        onBack={() => setScreen("home")}
        onPlay={() => setSoloRunId((id) => id + 1)}
        notify={notify}
      />
    );
  } else if (screen === "howto") {
    content = <HowToPlay onBack={() => setScreen("home")} />;
  } else if (screen === "lobby") {
    content = <Lobby room={room} game={safeGame} onBack={() => setScreen("home")} notify={notify} />;
  } else {
    content = <Home game={safeGame} onNavigate={setScreen} onPlaySolo={() => setSoloRunId((id) => id + 1)} />;
  }

  return (
    <div className="min-h-screen">
      {content}
      <Toast toast={toast} />
    </div>
  );
}
