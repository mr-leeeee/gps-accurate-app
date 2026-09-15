import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSavedPlaces,
  savePlace,
  updatePlace,
  deletePlace,
  clearAllPlaces,
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

  it('최초 실행 시 기본 장소 목록 반환', () => {
    const places = getSavedPlaces();
    expect(places.length).toBeGreaterThan(0);
    expect(places[0].id).toBe('sample-1');
  });

  it('장소 저장 후 목록에 추가', () => {
    const initial = getSavedPlaces();
    const updated = savePlace(mockPlace);
    expect(updated.length).toBe(initial.length + 1);
    expect(updated[0].id).toBe('test-1');
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
});