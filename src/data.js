// Données du jeu : questions centrales ISO 26000, banque de questions,
// mission de démonstration, barème et récompenses.
import { makeId } from "./lib/game.js";

export const ISO_26000_TAGS = [
  "Gouvernance de l'organisation",
  "Droits de l'Homme",
  "Relations et conditions de travail",
  "Environnement",
  "Loyauté des pratiques",
  "Questions relatives aux consommateurs",
  "Communautés et développement local",
];

export const QUESTION_BANK = [
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
  {
    isoTag: "Relations et conditions de travail",
    question: "Quel élément relève des relations et conditions de travail selon ISO 26000 ?",
    options: [
      { id: 1, text: "Le dialogue social", correct: true },
      { id: 2, text: "La spéculation financière", correct: false },
      { id: 3, text: "Le marketing viral", correct: false },
    ],
    hint: "Pensez à la concertation entre employeur et salariés.",
  },
  {
    isoTag: "Loyauté des pratiques",
    question: "Quelle pratique illustre la loyauté des pratiques ?",
    options: [
      { id: 1, text: "L'entente illicite sur les prix", correct: false },
      { id: 2, text: "La lutte contre la corruption", correct: true },
      { id: 3, text: "Le plagiat de marque", correct: false },
    ],
    hint: "Intégrité dans les relations d'affaires.",
  },
  {
    isoTag: "Questions relatives aux consommateurs",
    question: "Que doit garantir une organisation vis-à-vis des consommateurs ?",
    options: [
      { id: 1, text: "Des clauses cachées", correct: false },
      { id: 2, text: "Une information claire et loyale", correct: true },
      { id: 3, text: "La collecte illimitée de données", correct: false },
    ],
    hint: "Transparence de l'information.",
  },
  {
    isoTag: "Communautés et développement local",
    question: "Comment une organisation contribue-t-elle au développement local ?",
    options: [
      { id: 1, text: "En délocalisant systématiquement", correct: false },
      { id: 2, text: "En créant de l'emploi et des compétences localement", correct: true },
      { id: 3, text: "En évitant tout dialogue avec les riverains", correct: false },
    ],
    hint: "Ancrage territorial.",
  },
];

// Barème du jeu (points)
export const SCORING = {
  BASE_POINTS: 100,
  ERROR_PENALTY: 20,
  HINT_COST: 15,
  STREAK_BONUS: 25,
  TIME_BONUS_PER_MINUTE: 10,
};

// Badges décernés sur l'écran de fin. `test` reçoit le bilan de partie :
// { completed, errors, hintsUsed, timeLeft, totalTime, bestStreak }
export const BADGES = [
  { id: "finisher", icon: "🏁", label: "Mission accomplie", description: "Toutes les énigmes résolues", test: (r) => r.completed },
  { id: "flawless", icon: "🎯", label: "Sans-faute", description: "Aucune erreur commise", test: (r) => r.completed && r.errors === 0 },
  { id: "detective", icon: "🔍", label: "Fin limier", description: "Aucun indice utilisé", test: (r) => r.completed && r.hintsUsed === 0 },
  { id: "fast", icon: "⚡", label: "Contre-la-montre", description: "Terminé avec plus de la moitié du temps restant", test: (r) => r.completed && r.timeLeft >= r.totalTime / 2 },
  { id: "onfire", icon: "🔥", label: "En feu", description: "3 réussites du premier coup d'affilée", test: (r) => r.bestStreak >= 3 },
];

export const ENCOURAGEMENTS = [
  "Pas tout à fait… mais vous brûlez !",
  "Essayez encore, la solution est à portée de main.",
  "Un bon détective ne renonce jamais. Relisez l'indice !",
  "Presque ! Observez mieux les détails.",
  "La persévérance est la clé de cette énigme.",
];

export const DEFAULT_SCENE = () => ({
  id: makeId(),
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

// Mission de démonstration jouable immédiatement (premier lancement).
export const DEMO_GAME = () => ({
  meta: {
    title: "Opération NovaCorp",
    description:
      "Minuit, siège de NovaCorp. Un lanceur d'alerte a caché des preuves derrière cinq verrous inspirés de l'ISO 26000. Résolvez chaque énigme avant la fin du temps imparti pour faire éclater la vérité sur la responsabilité sociétale de l'entreprise.",
    author: "",
  },
  settings: { timeLimit: 20 },
  scenes: [
    {
      id: makeId(),
      title: "Le bureau du directoire",
      narrative:
        "La porte du bureau du PDG est entrouverte. Sur l'écran, un rapport de gouvernance clignote : une seule réponse déverrouille la session.",
      mediaUrl: "",
      isoTag: "Gouvernance de l'organisation",
      puzzle: {
        type: "qcm",
        question: "Quelle est une caractéristique clé d'une gouvernance responsable selon ISO 26000 ?",
        options: [
          { id: 1, text: "Opacité des décisions", correct: false },
          { id: 2, text: "Transparence et redevabilité", correct: true },
          { id: 3, text: "Décisions unilatérales", correct: false },
        ],
        hint: "Pensez au principe de transparence.",
        successText: "Session déverrouillée. Un plan du bâtiment apparaît à l'écran…",
      },
    },
    {
      id: makeId(),
      title: "Le coffre-fort de la salle RSE",
      narrative:
        "Un coffre-fort trône dans la salle RSE. Un post-it indique : « Le numéro de la norme internationale de la responsabilité sociétale ouvre le coffre. »",
      mediaUrl: "",
      isoTag: "Loyauté des pratiques",
      puzzle: {
        type: "codelock",
        question: "Saisissez le numéro de la norme internationale de la responsabilité sociétale.",
        answer: "26000",
        hint: "C'est aussi le nom de ce jeu…",
        successText: "Clic ! Le coffre s'ouvre sur un dossier d'archives confidentiel.",
      },
    },
    {
      id: makeId(),
      title: "La salle des archives",
      narrative:
        "Le dossier contient des fiches mélangées. Reconstituez les bonnes associations pour révéler le code de l'ascenseur.",
      mediaUrl: "",
      isoTag: "Droits de l'Homme",
      puzzle: {
        type: "match",
        pairs: [
          { left: "Gouvernance", right: "Processus de décision transparent" },
          { left: "Droits de l'Homme", right: "Diligence raisonnable" },
          { left: "Environnement", right: "Analyse du cycle de vie" },
          { left: "Consommateurs", right: "Information claire et loyale" },
        ],
        hint: "Chaque question centrale a son outil emblématique.",
        successText: "Les fiches s'alignent : l'ascenseur de service se déverrouille.",
      },
    },
    {
      id: makeId(),
      title: "Le laboratoire d'amélioration continue",
      narrative:
        "Au sous-sol, un tableau blanc affiche les étapes d'une démarche environnementale… dans le désordre. Remettez-les dans l'ordre pour couper l'alarme.",
      mediaUrl: "",
      isoTag: "Environnement",
      puzzle: {
        type: "ordering",
        ordering: ["Identifier les impacts", "Planifier les actions", "Agir", "Évaluer", "Améliorer"],
        orderingCorrect: ["Identifier les impacts", "Planifier les actions", "Agir", "Évaluer", "Améliorer"],
        hint: "Une démarche d'amélioration continue commence toujours par un état des lieux.",
        successText: "L'alarme se tait. La sortie est droit devant.",
      },
    },
    {
      id: makeId(),
      title: "Le hall de sortie",
      narrative:
        "Dernier verrou : la porte vitrée du hall. Le digicode pose une ultime question avant de vous laisser sortir avec les preuves.",
      mediaUrl: "",
      isoTag: "Questions relatives aux consommateurs",
      puzzle: {
        type: "qcm",
        question: "Que doit garantir une organisation vis-à-vis des consommateurs ?",
        options: [
          { id: 1, text: "Des clauses cachées", correct: false },
          { id: 2, text: "Une information claire et loyale", correct: true },
          { id: 3, text: "La collecte illimitée de données", correct: false },
        ],
        hint: "Transparence de l'information.",
        successText: "La porte s'ouvre. Mission accomplie, la vérité est en marche !",
      },
    },
  ],
});
