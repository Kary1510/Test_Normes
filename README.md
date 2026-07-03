# 🗝️ ISO 26000 Escape Game

Escape game pédagogique sur la **responsabilité sociétale (ISO 26000)** : créez vos missions dans l'éditeur, jouez-les en solo ou en multijoueur, partagez-les par lien ou fichier JSON.

Stack : **Vite + React 18 + Tailwind CSS + framer-motion** — aucun backend, aucune base de données.

## ✨ Fonctionnalités

### Jeu
- **Écran d'accueil** immersif avec accès direct au jeu, au multijoueur, à l'éditeur et aux règles.
- **Briefing de mission** avant chaque partie (synopsis, nombre d'énigmes, temps, barème).
- **5 types d'énigmes** : QCM, code secret, associations, ordonnancement, hotspots sur image.
- **Score et progression** : +100 pts par énigme, bonus de série (+25), malus d'erreur (−20) et d'indice (−15), bonus de temps en fin de partie.
- **Feedback immédiat** : animations de réussite/erreur, messages d'encouragement, effet de secousse, chronomètre qui s'affole sous la minute restante.
- **Indices à la demande** (contre quelques points).
- **Écran de fin valorisant** : étoiles (1 à 3), score détaillé, 5 trophées à débloquer (Sans-faute, Fin limier, Contre-la-montre, En feu, Mission accomplie), bilan énigme par énigme, bouton Rejouer.
- **Mission de démonstration** (« Opération NovaCorp », 5 énigmes) incluse au premier lancement.

### Multijoueur
- **Créer une partie** : l'hôte obtient un code court (ex. `K7KM3`).
- **Rejoindre avec un code** + pseudo, liste des joueurs connectés en temps réel.
- **Course au score** : tous les joueurs jouent la même mission simultanément.
- **Classement en direct** pendant la partie et **podium final** comparant les scores.
- États clairs : salon d'attente, « en attente du lancement par l'hôte », « en attente des autres joueurs », hôte déconnecté.

### Éditeur (mode créateur)
- Création/duplication/suppression de scènes, narratif, média (image/vidéo), 7 questions centrales ISO 26000.
- Banque de QCM prêts à l'emploi couvrant les 7 questions centrales.
- Export/import **JSON** (avec validation du fichier) et **lien de partage** encodé dans l'URL (compatible avec les anciens liens).
- Temps limite configurable, sauvegarde automatique dans le navigateur (localStorage).

## 🚀 Tester en local

```bash
npm install
npm run dev        # http://localhost:5173
```

Parcours de test conseillé :
1. **Solo** : Accueil → « Jouer en solo » → briefing → résolvez les 5 énigmes de la démo (le code du coffre est `26000`) → écran de fin avec étoiles et trophées.
2. **Multijoueur** : Accueil → « Multijoueur » → créez une partie avec un pseudo → **ouvrez un second onglet** sur la même adresse → « Rejoindre une partie » avec le code → l'hôte lance la partie → jouez dans les deux onglets et observez le classement en direct, puis le podium final.
3. **Éditeur** : Accueil → « Éditeur de mission » → modifiez les scènes, « Tester le jeu », exportez le JSON, copiez le lien de partage et ouvrez-le dans un onglet privé.

```bash
npm run build      # build de production dans dist/
npm run preview    # prévisualisation du build
```

## 📦 Déployer

Le site est 100 % statique : servez simplement le dossier `dist/`.

- **Netlify / Vercel** : connectez le dépôt, commande `npm run build`, dossier de publication `dist`.
- **GitHub Pages** : `npm run build` puis publiez `dist/` (ajoutez `base: '/<nom-du-repo>/'` dans `vite.config.js` si le site n'est pas servi à la racine).

## 🔌 Choix technique du multijoueur

Le multijoueur repose sur l'API **BroadcastChannel** du navigateur : chaque partie est un canal nommé d'après le code de la salle ; l'hôte détient l'état de référence (joueurs, scores, statut) et le rediffuse à chaque événement (`join`, `progress`, `leave`).

**Pourquoi ce choix ?** Le projet est un site statique sans backend : BroadcastChannel offre un vrai flux « créer / rejoindre par code / classement en direct » avec **zéro dépendance, zéro configuration, zéro coût** et un fonctionnement garanti hors-ligne — le meilleur rapport impact/complexité parmi les options envisagées (Firebase, Supabase, WebSocket, WebRTC).

**Limite assumée** : les joueurs doivent être dans le **même navigateur** (onglets/fenêtres) — parfait pour un atelier sur un poste, une démo ou un test. Pour jouer à distance, remplacez le transport dans `src/lib/multiplayer.js` par un serveur WebSocket ou Supabase Realtime : le protocole de messages (`join` / `state` / `progress` / `leave` / `end`) et toute l'UI (lobby, classement, podium) restent identiques.

## 🗂️ Structure du code

```
index.html                  Point d'entrée (favicon, meta, description)
src/
  main.jsx                  Bootstrap React
  App.jsx                   Navigation, accueil, toasts, import de liens partagés
  styles.css                Thème sombre, classes composants (.btn, .card, .input…)
  data.js                   Questions centrales, banque de QCM, démo, barème, badges
  lib/
    game.js                 Validation des énigmes, normalisation des jeux importés
    storage.js              localStorage, export/import JSON, liens de partage
    multiplayer.js          Salle multijoueur (BroadcastChannel, hook useRoom)
  components/
    Editor.jsx              Éditeur de mission complet
    Runner.jsx              Partie : briefing, énigmes, feedbacks, écran de fin
    puzzles.jsx             Les 5 énigmes côté joueur
    Lobby.jsx               Créer/rejoindre une partie, salon d'attente
    HowToPlay.jsx           Règles du jeu
```

## 🧭 Pistes d'amélioration

- Transport multijoueur à distance (Supabase Realtime ou petit serveur WebSocket) branché sur le protocole existant.
- Sons et musique d'ambiance (avec bouton muet).
- Éditeur visuel des zones de hotspots (dessin direct sur l'image).
- Mode équipe (hot-seat) sur un seul écran.
- Historique des scores et records personnels.
