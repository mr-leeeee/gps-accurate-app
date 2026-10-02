import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedPlaces,
  savePlace,
  updatePlace,
  deletePlace,
  clearAllPlaces,
  getTrash,
  restoreFromTrash,
  restoreAllFromTrash,
  deleteFromTrashPermanently,
  emptyTrash,
  exportPlacesToJSON,
  importPlacesFromJSON,
} from './storageService';
import type { SavedPlace } from '../types/location';

const mockPlace: SavedPlace = {
  id: 'test-1',
  customName: '테스트 장소',
  originalAddress: '서울특별시 강남구 테헤란로 152',
  latitude: 37.50005,
  longitude: 127.0365,
  accuracy: 4.8,
  altitude: 12.0,
  timestamp: Date.now(),
};

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('최초 실행 시 빈 목록 반환 (production은 샘플 주입 안 함)', () => {
    expect(getSavedPlaces()).toEqual([]);
  });

  it('장소 저장 후 목록에 추가', () => {
    savePlace(mockPlace);
    const updated = savePlace({ ...mockPlace, id: 'test-2' });
    expect(updated.length).toBe(2);
    expect(updated[0].id).toBe('test-2');
  });

  it('장소 이름 수정', () => {
    savePlace(mockPlace);
    const updated = updatePlace('test-1', '수정된 이름');
    const found = updated.find((p) => p.id === 'test-1');
    expect(found?.customName).toBe('수정된 이름');
  });

  it('장소 삭제', () => {
    savePlace(mockPlace);
    const updated = deletePlace('test-1');
    expect(updated.find((p) => p.id === 'test-1')).toBeUndefined();
  });

  it('전체 삭제', () => {
    savePlace(mockPlace);
    const updated = clearAllPlaces();
    expect(updated.length).toBe(0);
  });

  it('JSON 내보내기 및 가져오기', () => {
    clearAllPlaces();
    savePlace(mockPlace);
    const json = exportPlacesToJSON();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);

    clearAllPlaces();
    const imported = importPlacesFromJSON(json);
    expect(imported.length).toBe(1);
    expect(imported[0].id).toBe('test-1');
  });

  it('잘못된 JSON 가져오기 시 에러', () => {
    expect(() => importPlacesFromJSON('invalid')).toThrow();
  });

  describe('휴지통', () => {
    const resetToEmpty = () => {
      clearAllPlaces();
      emptyTrash();
    };

    it('삭제한 장소가 휴지통으로 이동되고 목록에서 사라진다', () => {
      resetToEmpty();
      savePlace(mockPlace);

      const updated = deletePlace('test-1');

      expect(updated.find((p) => p.id === 'test-1')).toBeUndefined();
      const trash = getTrash();
      expect(trash.length).toBe(1);
      expect(trash[0].place.id).toBe('test-1');
      expect(trash[0].deletedAt).toBeGreaterThan(0);
    });

    it('휴지통의 장소 하나를 되돌리면 목록으로 복원된다', () => {
      resetToEmpty();
      savePlace(mockPlace);
      deletePlace('test-1');

      const restored = restoreFromTrash('test-1');

      expect(restored.find((p) => p.id === 'test-1')).toBeDefined();
      expect(getTrash().length).toBe(0);
    });

    it('전체 삭제 시 모든 장소가 휴지통으로 이동한다', () => {
      resetToEmpty();
      savePlace(mockPlace);

      const updated = clearAllPlaces();

      expect(updated.length).toBe(0);
      expect(getTrash().length).toBe(1);
    });

    it('휴지통 전체를 한 번에 되돌릴 수 있다', () => {
      resetToEmpty();
      savePlace(mockPlace);
      clearAllPlaces();

      const restored = restoreAllFromTrash();

      expect(restored.find((p) => p.id === 'test-1')).toBeDefined();
      expect(getTrash().length).toBe(0);
    });

    it('휴지통에서 영구 삭제하면 복구할 수 없다', () => {
      resetToEmpty();
      savePlace(mockPlace);
      deletePlace('test-1');

      const updated = deleteFromTrashPermanently('test-1');

      expect(updated.length).toBe(0);
      expect(restoreFromTrash('test-1').find((p) => p.id === 'test-1')).toBeUndefined();
    });

    it('휴지통을 비우면 목록에도 휴지통에도 남지 않는다', () => {
      resetToEmpty();
      savePlace(mockPlace);
      deletePlace('test-1');

      const updated = emptyTrash();

      expect(updated.length).toBe(0);
      expect(getTrash().length).toBe(0);
      expect(getSavedPlaces().length).toBe(0);
    });

    it('없는 장소를 복원하려 하면 목록은 그대로 유지된다', () => {
      resetToEmpty();
      savePlace(mockPlace);

      const restored = restoreFromTrash('없는-아이디');

      expect(restored.length).toBe(1);
      expect(getTrash().length).toBe(0);
    });
  });
});