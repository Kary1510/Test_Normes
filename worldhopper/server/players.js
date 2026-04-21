// In-memory player registry

const players = new Map(); // socketId → PlayerData

export function addPlayer(id, data) {
  players.set(id, { id, ...data, updatedAt: Date.now() });
}

export function updatePlayer(id, updates) {
  const p = players.get(id);
  if (!p) return;
  players.set(id, { ...p, ...updates, updatedAt: Date.now() });
}

export function removePlayer(id) {
  players.delete(id);
}

export function getPlayer(id) {
  return players.get(id);
}

export function getPlayersInWorld(worldId) {
  return [...players.values()].filter(p => p.worldId === worldId);
}

export function getAllPlayers() {
  return [...players.values()];
}
