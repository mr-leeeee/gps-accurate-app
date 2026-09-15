import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocationManagement } from './useLocationManagement';

vi.mock('../services/locationService', () => ({
  fetchCurrentPosition: vi.fn(),
}));

import { fetchCurrentPosition } from '../services/locationService';
const mockFetchCurrentPosition = vi.mocked(fetchCurrentPosition);

describe('useLocationManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      },
      writable: true,
    });
  });

  it('초기 상태를 올바르게 설정한다', () => {
    const { result } = renderHook(() => useLocationManagement());
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.isLoadingLocation).toBe(false);
    expect(result.current.locationError).toBeNull();
    expect(result.current.toastMessage).toBeNull();
    expect(result.current.isLiveTracking).toBe(false);
  });

  it('handleMeasureLocation 성공 시 위치를 설정한다', async () => {
    const mockLocation = {
      latitude: 37.5,
      longitude: 127.0,
      accuracy: 3.0,
      altitude: 10.0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      address: '서울특별시 강남구',
    };
    mockFetchCurrentPosition.mockResolvedValue(mockLocation);

    const { result } = renderHook(() => useLocationManagement());
    await act(async () => {
      await result.current.handleMeasureLocation();
    });

    expect(result.current.currentLocation).toEqual(mockLocation);
    expect(result.current.isLoadingLocation).toBe(false);
    expect(result.current.locationError).toBeNull();
  });

  it('handleMeasureLocation 실패 시 에러를 설정한다', async () => {
    mockFetchCurrentPosition.mockRejectedValue(new Error('GPS 오류'));

    const { result } = renderHook(() => useLocationManagement());
    await act(async () => {
      await result.current.handleMeasureLocation();
    });

    expect(result.current.locationError).toBe('GPS 오류');
    expect(result.current.isLoadingLocation).toBe(false);
    expect(result.current.currentLocation).not.toBeNull();
  });

  it('handleSetMockLocation이 모의 위치를 설정한다', () => {
    const { result } = renderHook(() => useLocationManagement());
    const mockLocation = {
      latitude: 35.158698,
      longitude: 129.160384,
      accuracy: 2.8,
      altitude: 42.0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      address: '부산광역시 해운대구',
      isMock: true as const,
    };

    act(() => {
      result.current.handleSetMockLocation(mockLocation);
    });

    expect(result.current.currentLocation).toEqual(mockLocation);
  });

  it('showToast가 토스트 메시지를 설정한다', () => {
    const { result } = renderHook(() => useLocationManagement());
    act(() => {
      result.current.showToast('테스트 메시지');
    });
    expect(result.current.toastMessage).toBe('테스트 메시지');
  });

  it('showToast를 여러 번 호출하면 마지막 메시지가 유지된다', () => {
    const { result } = renderHook(() => useLocationManagement());
    act(() => {
      result.current.showToast('첫 번째 메시지');
    });
    act(() => {
      result.current.showToast('두 번째 메시지');
    });
    expect(result.current.toastMessage).toBe('두 번째 메시지');
  });

  it('toggleLiveTracking이 실시간 추적 상태를 토글한다', () => {
    const { result } = renderHook(() => useLocationManagement());
    expect(result.current.isLiveTracking).toBe(false);

    act(() => {
      result.current.toggleLiveTracking();
    });
    expect(result.current.isLiveTracking).toBe(true);

    act(() => {
      result.current.toggleLiveTracking();
    });
    expect(result.current.isLiveTracking).toBe(false);
  });
});
