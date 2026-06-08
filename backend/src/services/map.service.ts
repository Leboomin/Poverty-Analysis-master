import { readMapData } from '../repositories/map.repository.ts';

export function getMapData() {
  return readMapData();
}
