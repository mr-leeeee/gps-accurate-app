import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlaceManagement } from './usePlaceManagement';

// Mock storageService
vi.mock('../services/storageService', () => ({
  getSavedPlaces: vi.fn(() => []),
  savePlace: vi.fn((_place) => [_place]),
  updatePlace: vi.fn((_id, _name, _memo) => []),
  deletePlace: vi.fn(() => []),
  clearAllPlaces: vi.fn(() => []),
}));

// Mock navigationService
vi.mock('../services/navigationService', () => ({
  copyLocationText: vi.fn(() => Promise.resolve(true)),
  shareLocation: vi.fn(() => Promise.resolve()),
}));

// Mock routeService
vi.mock('../services/routeService', () => ({
  calculateDrivingRoute: vi.fn(() =>
    Promise.resolve({
      coordinates: [
        [37.5, 127.0],
        [37.4, 127.1],
      ],
      distanceMeters: 5000,
      durationSeconds: 600,
    })
  ),
  formatDistance: vi.fn((m: number) => `${(m / 1000).toFixed(1)}km`),
  formatDuration: vi.fn((s: number) => `${Math.floor(s / 60)}분`),
}));

describe('usePlaceManagement', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    expect(result.current.savedPlaces).toEqual([]);
    expect(result.current.selectedPlace).toBeNull();
    expect(result.current.editingPlace).toBeNull();
    expect(result.current.navigatingPlace).toBeNull();
    expect(result.current.routeCoordinates).toEqual([]);
    expect(result.current.stopOrders).toEqual({});
    expect(result.current.isCopied).toBe(false);
  });

  it('handleSaveCurrentPlace가 장소를 저장한다', async () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    const mockLocation = {
      latitude: 37.5,
      longitude: 127.0,
      accuracy: 3.0,
      altitude: 10.0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      address: '서울특별시 강남구',
      isMock: false as const,
    };

    act(() => {
      result.current.handleSaveCurrentPlace(mockLocation);
    });

    expect(result.current.savedPlaces.length).toBe(1);
    expect(mockShowToast).toHaveBeenCalled();
  });

  it('handleDeletePlace가 장소를 삭제한다', async () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    const mockLocation = {
      latitude: 37.5,
      longitude: 127.0,
      accuracy: 3.0,
      altitude: 10.0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      address: '서울특별시',
      isMock: false as const,
    };

    act(() => {
      result.current.handleSaveCurrentPlace(mockLocation);
    });

    const savedPlace = result.current.savedPlaces[0];
    act(() => {
      result.current.handleDeletePlace(savedPlace.id);
    });

    expect(mockShowToast).toHaveBeenCalledWith('장소가 목록에서 삭제되었습니다.');
  });

  it('handleClearAllPlaces가 전체 장소를 삭제한다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    act(() => {
      result.current.handleClearAllPlaces();
    });

    expect(mockShowToast).toHaveBeenCalledWith('모든 장소 목록이 삭제되었습니다.');
  });

  it('handleNavigatePlace가 네비게이션 장소를 설정한다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    const mockPlace = {
      id: 'test-1',
      customName: '테스트',
      originalAddress: '주소',
      latitude: 37.5,
      longitude: 127.0,
      accuracy: 3.0,
      altitude: null,
      timestamp: Date.now(),
    };

    act(() => {
      result.current.handleNavigatePlace(mockPlace);
    });

    expect(result.current.navigatingPlace).toEqual(mockPlace);
  });

  it('handleClearRoute가 경로를 초기화한다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    act(() => {
      result.current.handleClearRoute();
    });

    expect(result.current.routeCoordinates).toEqual([]);
    expect(result.current.stopOrders).toEqual({});
  });
});
