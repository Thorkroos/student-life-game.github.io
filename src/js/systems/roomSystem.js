export function addFurnitureAndUpdateComfort(state, furnitureId, data) {
  if (!state.room.furniture.includes(furnitureId)) {
    state.room.furniture.push(furnitureId);
  }
  updateComfort(state, data);
}

export function updateComfort(state, data) {
  const map = new Map(data.furniture.map(item => [item.id, item]));
  state.room.comfort = state.room.furniture.reduce((sum, id) => sum + (map.get(id)?.comfort || 0), 0);
}

export function getRoomLabel(state, data) {
  const map = new Map(data.furniture.map(item => [item.id, item]));
  const names = state.room.furniture.map(id => map.get(id)?.label || id);
  if (state.room.comfort >= 35) return '真正像人的房间';
  if (state.room.comfort >= 22) return '能学习也能活着的房间';
  if (state.room.comfort >= 12) return '初步成型的房间';
  return names.join(' + ');
}
