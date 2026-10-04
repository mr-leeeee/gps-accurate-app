import type { SavedPlace } from '../types/location';
import { AppError, NetworkError } from '../types/errors';
import { logger } from '../utils/logger';
import { getEnvNumber } from '../utils/env';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteResult {
  distanceMeters: number;     // 총 주행 거리 (미터)
  durationSeconds: number;    // 총 주행 시간 (초)
  coordinates: [number, number][]; // 지도에 그릴 [lat, lng] 좌표 배열
  summary?: string;
}

export interface OptimizedStop {
  place: SavedPlace;
  order: number;              // 방문 순서 (1, 2, 3...)
  distanceFromPrevMeters: number; // 이전 지점으로부터 거리
  durationFromPrevSeconds: number;// 이전 지점으로부터 시간
}

export interface MultiRouteResult {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  orderedStops: OptimizedStop[];
  allCoordinates: [number, number][];
}

export const MAX_OPTIMIZE_STOPS = 20;

const ROUTE_LEG_CONCURRENCY = 4;

const legCache = new Map<string, RouteResult>();

function legKey(a: RoutePoint, b: RoutePoint): string {
  const r = (n: number) => n.toFixed(5);
  return `${r(a.latitude)},${r(a.longitude)}>${r(b.latitude)},${r(b.longitude)}`;
}

export function clearRouteLegCache(): void {
  legCache.clear();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workerCount = Math.min(Math.max(limit, 1), items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * 거리 포맷팅 (m -> km 또는 m)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 시간 포맷팅 (초 -> 시간, 분)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${Math.max(1, mins)}분`;
  }
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}시간 ${remainMins}분` : `${hours}시간`;
}

/**
 * OSRM(Open Source Routing Machine) API를 통해 실제 도로 주행 경로 계산
 * - API 키 없이 즉시 동작
 */
export async function calculateDrivingRoute(
  start: RoutePoint,
  end: RoutePoint
): Promise<RouteResult> {
  const startCoord = `${start.longitude},${start.latitude}`;
  const endCoord = `${end.longitude},${end.latitude}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${startCoord};${endCoord}?overview=full&geometries=geojson`;

  const cacheKey = legKey(start, end);
  const cached = legCache.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getEnvNumber('VITE_OSRM_TIMEOUT', 6000));

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new NetworkError(`OSRM API 오류: ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new NetworkError('경로를 찾을 수 없습니다.');
    }

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const result: RouteResult = {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      coordinates,
      summary: route.legs?.[0]?.summary || '',
    };
    legCache.set(cacheKey, result);
    return result;
  } catch (err) {
    logger.warn('OSRM route failed, using straight-line fallback', err);
    // 대체: 하버사인 직선 거리 및 시속 30km 기준 추정치
    const straightDist = calculateHaversineDistance(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );
    // 실제 도로는 직선의 약 1.3배
    const estimatedRoadDist = straightDist * 1.35;
    // 도심 평균 속도 30km/h (8.33 m/s)
    const estimatedSeconds = estimatedRoadDist / 8.33;

    return {
      distanceMeters: estimatedRoadDist,
      durationSeconds: estimatedSeconds,
      coordinates: [
        [start.latitude, start.longitude],
        [end.latitude, end.longitude],
      ],
      summary: '추정 직선 우회 경로',
    };
  }
}

/**
 * 하버사인(Haversine) 직선 거리 계산 (미터)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 다중 장소 최적 방문 동선(순서) 계산 알고리즘 (Nearest Neighbor TSP)
 * 출발지(현재 위치)로부터 가장 가깝고 효율적인 순서대로 방문지를 정렬하고 전체 경로를 계산합니다.
 */
export async function optimizeMultiStops(
  start: RoutePoint,
  placesToVisit: SavedPlace[]
): Promise<MultiRouteResult> {
  if (placesToVisit.length === 0) {
    return {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      orderedStops: [],
      allCoordinates: [],
    };
  }

  if (placesToVisit.length > MAX_OPTIMIZE_STOPS) {
    throw new AppError(
      `Too many stops: ${placesToVisit.length}`,
      'TOO_MANY_STOPS',
      `경유지는 최대 ${MAX_OPTIMIZE_STOPS}개까지 계산할 수 있습니다. 선택을 줄여주세요.`,
      true
    );
  }

  if (placesToVisit.length === 1) {
    const single = placesToVisit[0];
    const route = await calculateDrivingRoute(start, {
      latitude: single.latitude,
      longitude: single.longitude,
    });
    return {
      totalDistanceMeters: route.distanceMeters,
      totalDurationSeconds: route.durationSeconds,
      orderedStops: [
        {
          place: single,
          order: 1,
          distanceFromPrevMeters: route.distanceMeters,
          durationFromPrevSeconds: route.durationSeconds,
        },
      ],
      allCoordinates: route.coordinates,
    };
  }

  const remaining = [...placesToVisit];
  const ordered: SavedPlace[] = [];
  let cursor: RoutePoint = { ...start };
  while (remaining.length > 0) {
    let bestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateHaversineDistance(
        cursor.latitude,
        cursor.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = { latitude: next.latitude, longitude: next.longitude };
  }

  const legs: Array<[RoutePoint, RoutePoint]> = [];
  let prev: RoutePoint = { ...start };
  for (const p of ordered) {
    const cur: RoutePoint = { latitude: p.latitude, longitude: p.longitude };
    legs.push([prev, cur]);
    prev = cur;
  }
  const routes = await mapWithConcurrency(
    legs,
    ROUTE_LEG_CONCURRENCY,
    ([a, b]) => calculateDrivingRoute(a, b)
  );

  const orderedStops: OptimizedStop[] = [];
  let allCoordinates: [number, number][] = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  for (let i = 0; i < ordered.length; i++) {
    const route = routes[i];
    totalDistanceMeters += route.distanceMeters;
    totalDurationSeconds += route.durationSeconds;
    allCoordinates = [...allCoordinates, ...route.coordinates];
    orderedStops.push({
      place: ordered[i],
      order: i + 1,
      distanceFromPrevMeters: route.distanceMeters,
      durationFromPrevSeconds: route.durationSeconds,
    });
  }

  return {
    totalDistanceMeters,
    totalDurationSeconds,
    orderedStops,
    allCoordinates,
  };
}
