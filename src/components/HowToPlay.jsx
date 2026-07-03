// Page « Comment jouer » : objectif, types d'énigmes, barème, multijoueur.
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BADGES, SCORING } from "../data.js";

const PUZZLE_TYPES = [
  { icon: "☑️", title: "QCM", text: "Cochez la ou les bonnes réponses, puis validez." },
  { icon: "🔐", title: "Code secret", text: "Déduisez le code à partir de l'indice et saisissez-le." },
  { icon: "🔗", title: "Associations", text: "Reliez chaque élément à sa bonne définition." },
  { icon: "🔢", title: "Ordonnancement", text: "Remettez les étapes dans le bon ordre avec les flèches." },
  { icon: "🎯", title: "Hotspots", text: "Cliquez sur les bonnes zones de l'image, sans erreur." },
];

export default function HowToPlay({ onBack }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4">
      <button className="btn btn-ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Accueil
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">📖 Comment jouer</h1>
          <p className="text-sm text-slate-400">Tout ce qu'il faut savoir avant de vous lancer dans la mission.</p>
        </div>

        <section className="card space-y-2 p-6">
          <h2 className="text-lg font-bold">🎯 Objectif</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Vous êtes enfermé·e dans un escape game consacré à la <b>responsabilité sociétale (ISO 26000)</b>. Résolvez
            toutes les énigmes avant la fin du chronomètre pour vous échapper avec le meilleur score. Chaque énigme est
            rattachée à l'une des 7 questions centrales de la norme.
          </p>
        </section>

        <section className="card space-y-3 p-6">
          <h2 className="text-lg font-bold">🧩 Les types d'énigmes</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {PUZZLE_TYPES.map((p) => (
              <li key={p.title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="text-sm font-semibold">
                  <span aria-hidden="true">{p.icon}</span> {p.title}
                </div>
                <div className="mt-1 text-xs text-slate-400">{p.text}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3 p-6">
          <h2 className="text-lg font-bold">🏆 Score et récompenses</h2>
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li>✅ Énigme résolue : <b>+{SCORING.BASE_POINTS} pts</b></li>
            <li>🔥 Réussites du premier coup enchaînées : <b>+{SCORING.STREAK_BONUS} pts</b> de bonus par énigme</li>
            <li>❌ Mauvaise réponse : <b>−{SCORING.ERROR_PENALTY} pts</b></li>
            <li>💡 Indice révélé : <b>−{SCORING.HINT_COST} pts</b></li>
            <li>⚡ Bonus de fin : <b>+{SCORING.TIME_BONUS_PER_MINUTE} pts</b> par minute restante</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1">
            {BADGES.map((b) => (
              <span key={b.id} className="chip" title={b.description}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </section>

        <section className="card space-y-2 p-6">
          <h2 className="text-lg font-bold">🎮 Multijoueur</h2>
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-slate-300">
            <li>Un joueur crée la partie et obtient un <b>code à 5 caractères</b>.</li>
            <li>Les autres ouvrent le jeu dans un autre onglet ou une autre fenêtre du même navigateur et saisissent le code.</li>
            <li>L'hôte lance la partie : tout le monde joue la même mission en même temps.</li>
            <li>Le classement est mis à jour en direct ; à la fin, un podium compare les scores.</li>
          </ol>
        </section>

        <section className="card space-y-2 p-6">
          <h2 className="text-lg font-bold">🛠️ Créer sa propre mission</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            L'éditeur permet de créer vos scènes (narratif, média, énigme), d'ajouter des QCM prêts à l'emploi sur les 7
            questions centrales, d'exporter/importer vos missions en JSON et de les partager par lien.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
