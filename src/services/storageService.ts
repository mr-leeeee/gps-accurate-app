import type { SavedPlace, TrashedPlace } from '../types/location';
import { StorageError } from '../types/errors';
import { GHOST_MODE, SAMPLE_PLACES } from '../constants';

const STORAGE_KEY = 'SMARTPHONE_GPS_SAVED_PLACES_V1';
const TRASH_KEY = 'SMARTPHONE_GPS_TRASH_V1';

/**
 * 휴지통 내용 불러오기
 */
function readTrash(): TrashedPlace[] {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new StorageError('휴지통을 불러오는데 실패했습니다.');
  }
}

/**
 * 휴지통 내용 저장하기
 */
function writeTrash(trash: TrashedPlace[]): void {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  } catch {
    throw new StorageError('휴지통 저장에 실패했습니다.');
  }
}

/**
 * 저장된 장소 목록 불러오기
 */
export function getSavedPlaces(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SavedPlace[] = GHOST_MODE ? SAMPLE_PLACES : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return [...initial];
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
  memo?: string,
  tags?: string[]
): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    const updated = current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          customName: customName.trim() || item.customName,
          memo: memo !== undefined ? memo.trim() : item.memo,
          tags: tags !== undefined ? tags : item.tags,
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
 * 장소 삭제 (휴지통으로 이동 — 복원 가능)
 */
export function deletePlace(id: string): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    const target = current.find((item) => item.id === id);
    if (!target) return current;

    writeTrash([{ place: target, deletedAt: Date.now() }, ...readTrash()]);

    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('장소 삭제에 실패했습니다.');
  }
}

/**
 * 전체 장소 삭제 (휴지통으로 이동 — 복원 가능)
 */
export function clearAllPlaces(): SavedPlace[] {
  try {
    const current = getSavedPlaces();
    if (current.length > 0) {
      const deletedAt = Date.now();
      writeTrash([...current.map((place) => ({ place, deletedAt })), ...readTrash()]);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('전체 장소 삭제에 실패했습니다.');
  }
}

/**
 * 휴지통 목록 불러오기
 */
export function getTrash(): TrashedPlace[] {
  return readTrash();
}

/**
 * 휴지통의 장소 하나를 목록으로 복원
 */
export function restoreFromTrash(id: string): SavedPlace[] {
  try {
    const trash = readTrash();
    const target = trash.find((item) => item.place.id === id);
    if (!target) return getSavedPlaces();

    writeTrash(trash.filter((item) => item.place.id !== id));

    const current = getSavedPlaces();
    if (current.some((place) => place.id === id)) return current;

    const updated = [target.place, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('장소 복원에 실패했습니다.');
  }
}

/**
 * 휴지통 전체를 목록으로 복원
 */
export function restoreAllFromTrash(): SavedPlace[] {
  try {
    const trash = readTrash();
    if (trash.length === 0) return getSavedPlaces();

    writeTrash([]);

    const trashedIds = new Set(trash.map((item) => item.place.id));
    const current = getSavedPlaces().filter((place) => !trashedIds.has(place.id));
    const updated = [...trash.map((item) => item.place), ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('휴지통 전체 복원에 실패했습니다.');
  }
}

/**
 * 휴지통의 장소를 복구 없이 영구 삭제
 */
export function deleteFromTrashPermanently(id: string): TrashedPlace[] {
  try {
    const updated = readTrash().filter((item) => item.place.id !== id);
    writeTrash(updated);
    return updated;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('휴지통에서 삭제에 실패했습니다.');
  }
}

/**
 * 휴지통을 모두 비우기
 */
export function emptyTrash(): TrashedPlace[] {
  try {
    writeTrash([]);
    return [];
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError('휴지통 비우기에 실패했습니다.');
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
 * 백업 파일의 각 항목이 SavedPlace 형태로 갖는지 확인
 */
function isValidSavedPlace(value: unknown): value is SavedPlace {
  if (typeof value !== 'object' || value === null) return false;
  const place = value as Record<string, unknown>;
  return (
    typeof place.id === 'string' &&
    typeof place.customName === 'string' &&
    typeof place.originalAddress === 'string' &&
    typeof place.latitude === 'number' &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === 'number' &&
    Number.isFinite(place.longitude) &&
    typeof place.timestamp === 'number'
  );
}

/**
 * JSON 문자열로부터 장소 목록 복원
 * 배열 여부뿐 아니라 각 항목의 필드 타입까지 검증한다.
 */
export function importPlacesFromJSON(jsonStr: string): SavedPlace[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new StorageError('백업 파일 형식이 올바르지 않습니다.');
  }

  if (!Array.isArray(parsed) || !parsed.every(isValidSavedPlace)) {
    throw new StorageError('백업 파일 형식이 올바르지 않습니다.');
  }

  const places = parsed.map((place) => ({
    ...place,
    accuracy: typeof place.accuracy === 'number' ? place.accuracy : 0,
    altitude: typeof place.altitude === 'number' ? place.altitude : null,
    memo: typeof place.memo === 'string' ? place.memo : '',
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  return places;
}
