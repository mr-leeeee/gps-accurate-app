import type { SavedPlace } from '../types/location';
import { StorageError } from '../types/errors';
import { SAMPLE_PLACES } from '../constants';

const STORAGE_KEY = 'SMARTPHONE_GPS_SAVED_PLACES_V1';

/**
 * 저장된 장소 목록 불러오기
 */
export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PLACES));
      return [...SAMPLE_PLACES];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    throw new StorageError('저장된 데이터를 불러오는데 실패했습니다.');
  }
}

/**
 * 새로운 장소 저장 (최신순으로 맨 앞 추가)
 */
export function savePlace(place: SavedPlace): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    const updated = [place, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    throw new StorageError('장소 저장에 실패했습니다.');
  }
}

/**
 * 장소 이름 및 메모 수정 (원하는 이름 변경)
 */
export function updatePlace(
  id: string,
  customName: string,
  memo?: string
): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    const updated = current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          customName: customName.trim() || item.customName,
          memo: memo !== undefined ? memo.trim() : item.memo,
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    throw new StorageError('장소 수정에 실패했습니다.');
  }
}

/**
 * 장소 삭제
 */
export function deletePlace(id: string): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    throw new StorageError('장소 삭제에 실패했습니다.');
  }
}

export function clearAllPlaces(): SavedPlace[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    throw new StorageError('전체 장소 삭제에 실패했습니다.');
  }
}

/**
 * 장소 목록 JSON 문자열로 내보내기 (백업용)
 */
export function exportPlacesToJSON(): string {
  const places = getSavedPlaces();
  return JSON.stringify(places, null, 2);
}

/**
 * JSON 문자열로부터 장소 목록 복원
 */
export function importPlacesFromJSON(jsonStr: string): SavedPlace[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('올바르지 않은 형식입니다.');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    throw new Error('백업 파일 형식이 올바르지 않습니다.');
  }
}
