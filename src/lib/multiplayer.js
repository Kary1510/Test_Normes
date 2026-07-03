// Multijoueur local sans serveur, fondé sur l'API BroadcastChannel :
// chaque partie est un canal nommé d'après un code court. L'hôte détient
// l'état de référence et le rediffuse à chaque changement ; les invités
// envoient leurs événements (join / progress / leave).
//
// Portée : onglets et fenêtres d'un même navigateur (aucune dépendance,
// aucune configuration). Pour du jeu à distance, remplacer ce transport
// par un serveur WebSocket ou Supabase Realtime — le protocole de messages
// ci-dessous reste identique (voir README).
import { useCallback, useEffect, useRef, useState } from "react";
import { makeId } from "./game.js";

// Alphabet sans caractères ambigus (pas de O/0, I/1/L…).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeRoomCode(length = 5) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

const channelName = (code) => `iso26000-escape-room-${code.toUpperCase()}`;

const newPlayer = ({ id, name }, isHost = false) => ({
  id,
  name,
  isHost,
  score: 0,
  sceneIndex: 0,
  errors: 0,
  finished: false,
});

export const isMultiplayerSupported = () => typeof BroadcastChannel !== "undefined";

export function useRoom() {
  const [state, setState] = useState(null); // instantané visible par l'UI
  const channelRef = useRef(null);
  const stateRef = useRef(null); // état de référence (hôte uniquement)
  const selfRef = useRef(null); // { id, name, role: 'host' | 'guest' }

  const closeChannel = () => {
    channelRef.current?.close();
    channelRef.current = null;
    stateRef.current = null;
    selfRef.current = null;
  };

  const hostBroadcast = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    channelRef.current?.postMessage({ t: "state", s });
    setState({ ...s });
  }, []);

  const hostApplyProgress = useCallback(
    (playerId, patch) => {
      const s = stateRef.current;
      if (!s) return;
      s.players = s.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p));
      if (s.status === "playing" && s.players.length > 0 && s.players.every((p) => p.finished)) {
        s.status = "finished";
      }
      hostBroadcast();
    },
    [hostBroadcast]
  );

  const handleHostMessage = useCallback(
    (m) => {
      const s = stateRef.current;
      if (!s || !m) return;
      if (m.t === "join") {
        if (s.status !== "lobby") {
          channelRef.current?.postMessage({ t: "deny", id: m.p.id, reason: "La partie a déjà commencé." });
          return;
        }
        if (!s.players.some((p) => p.id === m.p.id)) {
          s.players = [...s.players, newPlayer(m.p)];
        }
        hostBroadcast();
      } else if (m.t === "progress") {
        hostApplyProgress(m.id, m.patch);
      } else if (m.t === "leave") {
        s.players = s.players.filter((p) => p.id !== m.id);
        if (s.status === "playing" && s.players.length > 0 && s.players.every((p) => p.finished)) {
          s.status = "finished";
        }
        hostBroadcast();
      }
    },
    [hostBroadcast, hostApplyProgress]
  );

  const createRoom = useCallback(
    (name, game) => {
      const self = { id: makeId(), name, role: "host" };
      const code = makeRoomCode();
      const channel = new BroadcastChannel(channelName(code));
      channel.onmessage = (ev) => handleHostMessage(ev.data);
      selfRef.current = self;
      channelRef.current = channel;
      stateRef.current = {
        code,
        hostId: self.id,
        status: "lobby", // lobby | playing | finished | ended
        game,
        players: [newPlayer(self, true)],
      };
      setState({ ...stateRef.current });
    },
    [handleHostMessage]
  );

  const joinRoom = useCallback((code, name) => {
    return new Promise((resolve, reject) => {
      const self = { id: makeId(), name, role: "guest" };
      const channel = new BroadcastChannel(channelName(code));
      let joined = false;
      const timeout = setTimeout(() => {
        if (!joined) {
          channel.close();
          reject(
            new Error(
              "Aucune partie trouvée avec ce code. Vérifiez le code et que la partie est bien ouverte dans un autre onglet de ce navigateur."
            )
          );
        }
      }, 2500);

      channel.onmessage = (ev) => {
        const m = ev.data;
        if (!m) return;
        if (m.t === "state") {
          const isMember = m.s.players.some((p) => p.id === self.id);
          if (!joined && isMember) {
            joined = true;
            clearTimeout(timeout);
            selfRef.current = self;
            channelRef.current = channel;
            setState(m.s);
            resolve();
          } else if (joined) {
            setState(isMember ? m.s : { ...m.s, status: "ended" });
          }
        } else if (m.t === "deny" && m.id === self.id) {
          clearTimeout(timeout);
          channel.close();
          reject(new Error(m.reason || "Impossible de rejoindre la partie."));
        } else if (m.t === "end" && joined) {
          setState((prev) => (prev ? { ...prev, status: "ended" } : prev));
        }
      };

      channel.postMessage({ t: "join", p: { id: self.id, name: self.name } });
    });
  }, []);

  const startGame = useCallback(
    (game) => {
      const s = stateRef.current;
      if (!s || selfRef.current?.role !== "host") return;
      if (game) s.game = game;
      s.status = "playing";
      hostBroadcast();
    },
    [hostBroadcast]
  );

  // Appelé par le Runner après chaque validation : { score, sceneIndex, errors, finished }
  const reportProgress = useCallback(
    (patch) => {
      const self = selfRef.current;
      if (!self) return;
      if (self.role === "host") {
        hostApplyProgress(self.id, patch);
      } else {
        channelRef.current?.postMessage({ t: "progress", id: self.id, patch });
        // Mise à jour optimiste locale en attendant la rediffusion de l'hôte.
        setState((prev) =>
          prev
            ? { ...prev, players: prev.players.map((p) => (p.id === self.id ? { ...p, ...patch } : p)) }
            : prev
        );
      }
    },
    [hostApplyProgress]
  );

  const leaveRoom = useCallback(() => {
    const self = selfRef.current;
    if (self?.role === "host") {
      channelRef.current?.postMessage({ t: "end" });
    } else if (self) {
      channelRef.current?.postMessage({ t: "leave", id: self.id });
    }
    closeChannel();
    setState(null);
  }, []);

  // Prévenir les autres joueurs si l'onglet se ferme en pleine partie.
  useEffect(() => {
    if (!state) return;
    const onUnload = () => {
      const self = selfRef.current;
      if (self?.role === "host") channelRef.current?.postMessage({ t: "end" });
      else if (self) channelRef.current?.postMessage({ t: "leave", id: self.id });
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [state]);

  return {
    supported: isMultiplayerSupported(),
    state,
    selfId: selfRef.current?.id ?? null,
    isHost: selfRef.current?.role === "host",
    createRoom,
    joinRoom,
    startGame,
    reportProgress,
    leaveRoom,
  };
}
