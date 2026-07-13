export function getCityLabel(state, data) {
  return data.cities?.find(item => item.id === state.city)?.label || state.city || '未知城市';
}

export function getAccommodationLabel(state, data) {
  return data.accommodations?.find(item => item.id === state.accommodation)?.label || state.accommodation || '未知住宿';
}
