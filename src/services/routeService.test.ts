import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDistance,
  formatDuration,
  calculateHaversineDistance,
  optimizeMultiStops,
  calculateDrivingRoute,
  clearRouteLegCache,
  MAX_OPTIMIZE_STOPS,
} from './routeService';
import type { SavedPlace } from '../types/location';

describe('routeService', () => {
  describe('formatDistance', () => {
    it('1000m 미만일 때 미터 단위 반환', () => {
      expect(formatDistance(500)).toBe('500m');
    });

    it('1000m 이상일 때 km 단위 반환', () => {
      expect(formatDistance(1500)).toBe('1.5km');
    });

    it('정확한 km 포맷', () => {
      expect(formatDistance(3200)).toBe('3.2km');
    });
  });

  describe('formatDuration', () => {
    it('60초 미만일 때 분 단위 반환', () => {
      expect(formatDuration(30)).toBe('1분');
    });

    it('1시간일 때', () => {
      expect(formatDuration(3600)).toBe('1시간');
    });

    it('1시간 30분일 때', () => {
      expect(formatDuration(5400)).toBe('1시간 30분');
    });
  });

  describe('calculateHaversineDistance', () => {
    it('동일 지점 거리 0', () => {
      const dist = calculateHaversineDistance(37.5, 127.0, 37.5, 127.0);
      expect(dist).toBe(0);
    });

    it('서울시청-강남역 약 8km', () => {
      const dist = calculateHaversineDistance(37.5665, 126.978, 37.498, 127.027);
      expect(dist).toBeGreaterThan(7000);
      expect(dist).toBeLessThan(10000);
    });

    it('서울-부산 약 325km', () => {
      const dist = calculateHaversineDistance(37.5665, 126.978, 35.158, 129.061);
      expect(dist).toBeGreaterThan(300000);
      expect(dist).toBeLessThan(350000);
    });
  });
});

describe('optimizeMultiStops', () => {
  const mockFetch = vi.fn();

  const makePlace = (id: string, latitude: number, longitude: number): SavedPlace => ({
    id,
    customName: id,
    originalAddress: '주소',
    latitude,
    longitude,
    accuracy: 10,
    altitude: null,
    timestamp: Date.now(),
  });

  const osrmOk = () => ({
    ok: true,
    json: async () => ({
      routes: [
        {
          distance: 1000,
          duration: 300,
          geometry: { coordinates: [[126.978, 37.5665]] },
          legs: [{ summary: '' }],
        },
      ],
    }),
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    clearRouteLegCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('상한 초과 시 네트워크 호출 없이 거부한다', async () => {
    const places = Array.from({ length: MAX_OPTIMIZE_STOPS + 1 }, (_, i) =>
      makePlace(`p${i}`, 37.5 + i * 0.001, 127.0)
    );
    await expect(
      optimizeMultiStops({ latitude: 37.5, longitude: 127.0 }, places)
    ).rejects.toMatchObject({ code: 'TOO_MANY_STOPS' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('상한 개수면 계산한다', async () => {
    mockFetch.mockResolvedValue(osrmOk());
    const places = Array.from({ length: MAX_OPTIMIZE_STOPS }, (_, i) =>
      makePlace(`p${i}`, 37.5 + i * 0.001, 127.0)
    );
    const res = await optimizeMultiStops(
      { latitude: 37.5, longitude: 127.0 },
      places
    );
    expect(res.orderedStops).toHaveLength(MAX_OPTIMIZE_STOPS);
  });

  it('탐욕 방문 순서를 유지한다', async () => {
    mockFetch.mockResolvedValue(osrmOk());
    const start = { latitude: 37.5665, longitude: 126.978 };
    const a = makePlace('A', 37.5666, 126.9781);
    const b = makePlace('B', 37.498, 127.027);
    const c = makePlace('C', 37.55, 127.0);
    const res = await optimizeMultiStops(start, [b, c, a]);
    expect(res.orderedStops.map((s) => s.place.id)).toEqual(['A', 'C', 'B']);
    expect(res.orderedStops.map((s) => s.order)).toEqual([1, 2, 3]);
  });

  it('구간 조회를 동시에 4개까지만 수행한다', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          inFlight++;
          maxInFlight = Math.max(maxInFlight, inFlight);
          setTimeout(() => {
            inFlight--;
            resolve(osrmOk());
          }, 10);
        })
    );
    const places = Array.from({ length: 6 }, (_, i) =>
      makePlace(`q${i}`, 37.5 + (i + 1) * 0.01, 127.0 + (i + 1) * 0.01)
    );
    const res = await optimizeMultiStops(
      { latitude: 37.5, longitude: 127.0 },
      places
    );
    expect(res.orderedStops).toHaveLength(6);
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(maxInFlight).toBeGreaterThan(1);
  });
});

describe('calculateDrivingRoute 캐시', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    clearRouteLegCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('같은 구간 두 번이면 fetch 1회만 수행한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 1000,
            duration: 300,
            geometry: { coordinates: [[127.1, 37.6]] },
            legs: [{ summary: '' }],
          },
        ],
      }),
    });
    const a = { latitude: 37.5, longitude: 127.0 };
    const b = { latitude: 37.6, longitude: 127.1 };
    await calculateDrivingRoute(a, b);
    await calculateDrivingRoute(a, b);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('캐시 비우기 후 다시 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            distance: 1000,
            duration: 300,
            geometry: { coordinates: [[127.1, 37.6]] },
            legs: [{ summary: '' }],
          },
        ],
      }),
    });
    const a = { latitude: 37.5, longitude: 127.0 };
    const b = { latitude: 37.6, longitude: 127.1 };
    await calculateDrivingRoute(a, b);
    clearRouteLegCache();
    await calculateDrivingRoute(a, b);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});