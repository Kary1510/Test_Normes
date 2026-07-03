// World rooms — tracks collected items per world session

const WORLD_IDS = ['forest', 'space', 'medieval', 'volcano'];

// collected items persist until server restarts (session-scoped)
const roomState = {};
for (const wid of WORLD_IDS) {
  roomState[wid] = { collectedKeys: new Set() };
}

export function markCollected(worldId, itemKey) {
  if (!roomState[worldId]) return;
  roomState[worldId].collectedKeys.add(itemKey);
}

export function getWorldState(worldId) {
  if (!roomState[worldId]) return { worldId, collectedKeys: [] };
  return {
    worldId,
    collectedKeys: [...roomState[worldId].collectedKeys],
  };
}

export function getRoomName(worldId) {
  return `world:${worldId}`;
}
