// Salon multijoueur : création d'une partie (code court) et
// entrée dans une partie existante, liste des joueurs connectés,
// lancement par l'hôte.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Crown, Info, Loader2, Play, Users, X } from "lucide-react";

export default function Lobby({ room, game, onBack, notify }) {
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  const canPlay = game.scenes.length > 0;

  const handleCreate = () => {
    const name = hostName.trim();
    if (!name) return setError("Choisissez un pseudo pour créer la partie.");
    if (!canPlay) return setError("Ajoutez au moins une scène dans l'éditeur avant de créer une partie.");
    setError(null);
    room.createRoom(name, game);
  };

  const handleJoin = async () => {
    const name = guestName.trim();
    const code = joinCode.trim().toUpperCase();
    if (!name) return setError("Choisissez un pseudo pour rejoindre la partie.");
    if (code.length < 4) return setError("Saisissez le code de la partie (5 caractères).");
    setError(null);
    setJoining(true);
    try {
      await room.joinRoom(code, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.state.code);
      notify("Code copié dans le presse-papiers !", "success");
    } catch {
      window.prompt("Copiez le code de la partie :", room.state.code);
    }
  };

  if (!room.supported) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-4">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Accueil
        </button>
        <div className="card p-8 text-center text-sm text-slate-300">
          Le multijoueur nécessite un navigateur récent (API BroadcastChannel indisponible).
        </div>
      </div>
    );
  }

  // ---------- Salon d'attente (partie créée ou rejointe) ----------
  if (room.state && room.state.status === "lobby") {
    const players = room.state.players;
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <button
          className="btn btn-ghost"
          onClick={() => {
            room.leaveRoom();
            onBack();
          }}
        >
          <X className="h-4 w-4" aria-hidden="true" /> Quitter le salon
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card space-y-6 p-6 text-center sm:p-8">
          <div className="space-y-1">
            <span className="chip !border-amber-400/40 !text-amber-300">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> Salon multijoueur
            </span>
            <h1 className="text-2xl font-bold">{room.state.game?.meta?.title}</h1>
          </div>

          <div className="space-y-2">
            <div className="label">Code de la partie</div>
            <div className="flex items-center justify-center gap-2">
              <span className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-6 py-3 font-mono text-3xl font-bold tracking-[0.35em] text-amber-300">
                {room.state.code}
              </span>
              <button className="btn !px-3" onClick={copyCode} aria-label="Copier le code">
                <Copy className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Les autres joueurs ouvrent le jeu dans un <b>autre onglet ou une autre fenêtre de ce navigateur</b>, puis
              saisissent ce code dans « Rejoindre une partie ».
            </p>
          </div>

          <div className="space-y-2 text-left">
            <div className="label">
              Joueurs connectés ({players.length})
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {players.map((p) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm
                    ${p.id === room.selfId ? "border-amber-400/50 bg-amber-400/10" : "border-slate-700 bg-slate-900/70"}`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold uppercase"
                    aria-hidden="true"
                  >
                    {p.name.charAt(0)}
                  </span>
                  <span className="flex-1 truncate font-medium">
                    {p.name}
                    {p.id === room.selfId && <span className="ml-1.5 text-xs text-amber-300">(vous)</span>}
                  </span>
                  {p.isHost && <Crown className="h-4 w-4 text-amber-400" title="Hôte de la partie" />}
                </motion.li>
              ))}
            </ul>
          </div>

          {room.isHost ? (
            <button className="btn btn-primary px-8 py-3 text-base" onClick={() => room.startGame()}>
              <Play className="h-5 w-5" aria-hidden="true" /> Lancer la partie ({players.length} joueur{players.length > 1 ? "s" : ""})
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> En attente du lancement par l'hôte…
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ---------- Créer / rejoindre ----------
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <button className="btn btn-ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Accueil
      </button>

      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">🎮 Multijoueur</h1>
        <p className="text-sm text-slate-400">Affrontez-vous sur la même mission : le meilleur score l'emporte.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">Créer une partie</h2>
          <p className="text-sm text-slate-400">
            Vous serez l'hôte de la mission « {game.meta.title} » ({game.scenes.length} énigme{game.scenes.length > 1 ? "s" : ""}).
          </p>
          <div>
            <label className="label mb-1" htmlFor="host-name">Votre pseudo</label>
            <input
              id="host-name"
              className="input"
              maxLength={20}
              placeholder="Ex : Alex"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <button className="btn btn-primary w-full" onClick={handleCreate}>
            Créer la partie
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="card space-y-4 p-6"
        >
          <h2 className="text-lg font-bold">Rejoindre une partie</h2>
          <div>
            <label className="label mb-1" htmlFor="join-code">Code de la partie</label>
            <input
              id="join-code"
              className="input font-mono uppercase tracking-[0.3em]"
              maxLength={6}
              placeholder="ABCDE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="label mb-1" htmlFor="guest-name">Votre pseudo</label>
            <input
              id="guest-name"
              className="input"
              maxLength={20}
              placeholder="Ex : Sam"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <button className="btn w-full" onClick={handleJoin} disabled={joining}>
            {joining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {joining ? "Connexion…" : "Rejoindre"}
          </button>
        </motion.section>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-xs text-sky-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Mode multijoueur <b>local, sans serveur</b> : les joueurs se connectent depuis des onglets ou fenêtres du même
          navigateur (idéal en atelier ou pour tester). Pour jouer à distance, l'architecture est prête à accueillir un
          serveur WebSocket ou Supabase — voir le README.
        </p>
      </div>
    </div>
  );
}
