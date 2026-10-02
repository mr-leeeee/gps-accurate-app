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
  getTrash: vi.fn(() => []),
  restoreFromTrash: vi.fn(() => []),
  restoreAllFromTrash: vi.fn(() => []),
  deleteFromTrashPermanently: vi.fn(() => []),
  emptyTrash: vi.fn(() => []),
  importPlacesFromJSON: vi.fn(() => []),
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
    expect(result.current.trash).toEqual([]);
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

  it('handleDeletePlace가 장소를 삭제하고 되돌리기 액션을 제공한다', async () => {
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

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('삭제됨'),
      expect.objectContaining({ label: '되돌리기' })
    );
  });

  it('handleClearAllPlaces가 전체 장소를 휴지통으로 옮긴다', () => {
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
    act(() => {
      result.current.handleClearAllPlaces();
    });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('휴지통'),
      expect.objectContaining({ label: '전부 되돌리기' })
    );
  });

  it('handleRestorePlace가 휴지통에서 장소를 되돌린다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    act(() => {
      result.current.handleRestorePlace('test-1');
    });

    expect(mockShowToast).toHaveBeenCalledWith('장소를 목록으로 되돌렸습니다.');
  });

  it('handleEmptyTrash가 휴지통을 비운다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    act(() => {
      result.current.handleEmptyTrash();
    });

    expect(result.current.trash).toEqual([]);
    expect(mockShowToast).toHaveBeenCalledWith('휴지통을 모두 비웠습니다.');
  });

  it('handleImportBackup이 백업 파일을 불러온다', () => {
    const { result } = renderHook(() =>
      usePlaceManagement({ showToast: mockShowToast })
    );

    let succeeded = true;
    act(() => {
      succeeded = result.current.handleImportBackup('[]');
    });

    expect(succeeded).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith('백업 파일에서 0개의 장소를 불러왔습니다.');
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
