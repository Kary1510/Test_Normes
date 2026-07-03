// Persistance locale, import/export de fichiers et encodage des liens de partage.
import { useEffect, useState } from "react";

export const STORAGE_KEY = "iso26000_escape_builder_pack";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      /* stockage indisponible ou corrompu : on repart des valeurs par défaut */
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota dépassé ou navigation privée : l'app reste utilisable en mémoire */
    }
  }, [key, value]);

  return [value, setValue];
}

export const downloadJSON = (data, filename = "escape_iso26000.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

export function slugify(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Encodage base64 identique à la version historique pour rester compatible
// avec les anciens liens ?game=…
export const encodeGameParam = (game) =>
  encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(game)))));

export const decodeGameParam = (raw) =>
  JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));
