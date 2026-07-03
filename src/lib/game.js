// Logique métier pure : identifiants, normalisation d'un jeu importé,
// validation des énigmes, utilitaires de temps et de mélange.

export const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Mélange de Fisher-Yates (non biaisé, contrairement à sort(random)).
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

// Complète un jeu importé (JSON, lien partagé, localStorage) avec des valeurs
// par défaut sûres. Retourne null si la structure est inexploitable.
export function normalizeGame(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.scenes)) return null;
  return {
    meta: {
      title: "Escape Game – ISO 26000",
      description: "",
      author: "",
      ...(data.meta || {}),
    },
    settings: { timeLimit: 20, ...(data.settings || {}) },
    scenes: data.scenes
      .filter((s) => s && typeof s === "object")
      .map((s) => ({
        title: "Scène",
        narrative: "",
        mediaUrl: "",
        isoTag: "",
        ...s,
        id: s.id || makeId(),
        puzzle: { type: "qcm", hint: "", successText: "Bravo !", ...(s.puzzle || {}) },
      })),
  };
}

// Valide la réponse du joueur pour une énigme. `answer` est l'objet de
// réponses de la scène ({ qcm, code, pairs, ordering, hotspots }).
export function validatePuzzle(puzzle, answer = {}) {
  switch (puzzle.type) {
    case "qcm": {
      const chosen = [...(answer.qcm || [])].sort().join(",");
      const expected = (puzzle.options || [])
        .filter((o) => o.correct)
        .map((o) => o.id)
        .sort()
        .join(",");
      return chosen.length > 0 && chosen === expected;
    }
    case "codelock": {
      const input = (answer.code || "").trim().toLowerCase();
      return input.length > 0 && input === (puzzle.answer || "").trim().toLowerCase();
    }
    case "match": {
      const pairs = answer.pairs || [];
      return (
        (puzzle.pairs || []).length > 0 &&
        pairs.length === puzzle.pairs.length &&
        pairs.every((pair, i) => pair.right === puzzle.pairs[i].right)
      );
    }
    case "ordering": {
      const arr = answer.ordering || [];
      const correct = puzzle.orderingCorrect?.length ? puzzle.orderingCorrect : puzzle.ordering || [];
      return correct.length > 0 && JSON.stringify(arr) === JSON.stringify(correct);
    }
    case "hotspot": {
      const clicks = answer.hotspots || [];
      const correctZones = (puzzle.hotspots?.targets || []).filter((z) => z.correct).length;
      return (
        correctZones > 0 &&
        clicks.filter((c) => c.correct).length === correctZones &&
        clicks.length === correctZones
      );
    }
    default:
      return false;
  }
}
