/**
 * Curated Lorem Picsum image IDs (urban / architecture / skylines).
 * Used for listing cover fallbacks and DB seeding — hotlink-friendly, no Unsplash API.
 * @see https://picsum.photos/
 */
export const LISTING_BUILDING_PICSUM_IDS = [
  208, 209, 210, 211, 217, 219, 220, 237, 238, 241, 244, 247, 248, 249, 250, 251, 252, 254, 255, 257, 258, 288, 293, 307,
] as const;

function stableIndex(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

/** Deterministic building-style cover URL for a room (matches migration spirit). */
export function buildingCoverUrlForRoomId(roomId: string, w = 1200, h = 900): string {
  const idx = stableIndex(roomId, LISTING_BUILDING_PICSUM_IDS.length);
  const id = LISTING_BUILDING_PICSUM_IDS[idx];
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}
