import type { AccuracyInfo, LocationData } from '../types/location';
import { Geolocation } from '@capacitor/geolocation';
import { GeolocationError, NetworkError } from '../types/errors';
import { logger } from '../utils/logger';
import { getEnvNumber } from '../utils/env';
import { ACCURACY_THRESHOLDS } from '../constants';

interface NominatimAddress {
  country?: string;
  province?: string;
  state?: string;
  city_district?: string;
  city?: string;
  county?: string;
  suburb?: string;
  borough?: string;
  town?: string;
  road?: string;
  quarter?: string;
  neighbourhood?: string;
  house_number?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
  name?: string;
  lat?: string;
  lon?: string;
  type?: string;
}

/**
 * GPS 오차 범위(accuracy)에 따른 정밀도 정보 반환
 */
export function getAccuracyInfo(accuracy: number): AccuracyInfo {
  if (accuracy <= ACCURACY_THRESHOLDS.EXCELLENT) {
    return {
      level: 'excellent',
      text: '매우 정밀 (±' + accuracy.toFixed(1) + 'm)',
      color: '#10b981',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: '고정밀 GPS 수신 상태입니다. 네비게이션 및 길안내에 최적입니다.',
    };
  } else if (accuracy <= ACCURACY_THRESHOLDS.GOOD) {
    return {
      level: 'good',
      text: '우수 (±' + accuracy.toFixed(1) + 'm)',
      color: '#06b6d4',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      description: '위치 오차가 적어 일반적인 장소 기록에 충분합니다.',
    };
  } else if (accuracy <= ACCURACY_THRESHOLDS.FAIR) {
    return {
      level: 'fair',
      text: '보통 (±' + accuracy.toFixed(1) + 'm)',
      color: '#f59e0b',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: '주변 건물이나 지형의 영향을 받고 있을 수 있습니다.',
    };
  } else {
    return {
      level: 'poor',
      text: '오차 큼 (±' + accuracy.toFixed(1) + 'm)',
      color: '#ef4444',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      description: '실내이거나 GPS 위성 신호가 약합니다. 실외로 이동을 권장합니다.',
    };
  }
}

/**
 * 고정밀 현재 위치 측정 (Capacitor 네이티브 GPS 우선 지원, 웹 폴백)
 */
export async function fetchCurrentPosition(): Promise<LocationData> {
  // 1. Capacitor 네이티브 환경인 경우 네이티브 Geolocation 시도
  try {
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') {
        throw new GeolocationError('PERMISSION_DENIED', '위치 권한 거부');
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: getEnvNumber('VITE_API_TIMEOUT', 10000),
      maximumAge: 0,
    });

    const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
    let address = '';
    try {
      address = await reverseGeocode(latitude, longitude);
    } catch (geocodeErr) {
      logger.warn('Reverse geocode failed, using coordinates', geocodeErr);
      address = `위도: ${latitude.toFixed(5)}, 경도: ${longitude.toFixed(5)}`;
    }

    return {
      latitude,
      longitude,
      accuracy: Math.round(accuracy * 10) / 10,
      altitude: altitude !== null ? Math.round(altitude * 10) / 10 : null,
      heading,
      speed,
      timestamp: pos.timestamp || Date.now(),
      address,
    };
  } catch (nativeErr) {
    if (nativeErr instanceof GeolocationError) {
      throw nativeErr;
    }
    logger.warn('Native Geolocation fallback to web navigator', nativeErr);
  }

  // 2. 웹 브라우저 환경 또는 네이티브 실패 시 fallback
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('POSITION_UNAVAILABLE', 'GPS 미지원'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = pos.coords;
        let address = '';
        try {
          address = await reverseGeocode(latitude, longitude);
        } catch (geocodeErr) {
          logger.warn('Reverse geocode failed in web fallback', geocodeErr);
          address = `위도: ${latitude.toFixed(5)}, 경도: ${longitude.toFixed(5)}`;
        }

        resolve({
          latitude,
          longitude,
          accuracy: Math.round(accuracy * 10) / 10,
          altitude: altitude !== null ? Math.round(altitude * 10) / 10 : null,
          heading,
          speed,
          timestamp: pos.timestamp || Date.now(),
          address,
        });
      },
      (err) => {
        let code = 'DEFAULT';
        if (err.code === err.PERMISSION_DENIED) {
          code = 'PERMISSION_DENIED';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          code = 'POSITION_UNAVAILABLE';
        } else if (err.code === err.TIMEOUT) {
          code = 'TIMEOUT';
        }
        reject(new GeolocationError(code, err.message));
      },
      options
    );
  });
}

/**
 * 위도/경도를 한글 도로명 및 지번 주소로 역지오코딩 (OSM Nominatim)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getEnvNumber('VITE_REVERSE_GEOCODE_TIMEOUT', 4000));

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SmartPhone-GPS-App/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new NetworkError(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.display_name) {
      return formatKoreanAddress(data);
    }
    return `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`;
  } catch (e) {
    logger.warn('Reverse geocode error', e);
    return `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`;
  }
}

/**
 * OpenStreetMap 결과에서 한국식 주소 형태로 가공
 */
function formatKoreanAddress(data: NominatimResponse): string {
  const addr = data.address;
  if (!addr) return data.display_name || '';

  const country = addr.country === '대한민국' ? '' : (addr.country || '');
  const province = addr.province || addr.state || addr.city_district || '';
  const city = addr.city || addr.county || '';
  const borough = addr.suburb || addr.borough || addr.town || '';
  const road = addr.road || addr.quarter || addr.neighbourhood || '';
  const houseNumber = addr.house_number ? `${addr.house_number}번지` : '';

  const parts = [country, province, city, borough, road, houseNumber].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return data.display_name || '';
}

export interface AddressSearchResult {
  displayName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  type?: string;
}

export function normalizeAddress(input: string): string {
  let result = input.trim();
  // 한글 뒤에 오는 마지막 숫자 시퀀스(건물번호) 앞에 띄어쓰기 추가
  // 예: "황금3로7번길56" → "황금3로7번길 56", "강남대로390" → "강남대로 390"
  // "세종대로110번지" → 변경 없음 (번지 앞이 아님)
  result = result.replace(/([가-힣])(\d+)$/, '$1 $2');
  return result;
}

const MEMORY_CACHE = new Map<string, { data: AddressSearchResult[]; ts: number }>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000;
const LOCAL_STORAGE_KEY = 'gps_address_cache';
const LOCAL_CACHE_TTL = 24 * 60 * 60 * 1000;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100;

function loadLocalStorageCache(): Map<string, { data: AddressSearchResult[]; ts: number }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as [string, { data: AddressSearchResult[]; ts: number }][];
    const now = Date.now();
    const filtered = parsed.filter(([, v]) => now - v.ts < LOCAL_CACHE_TTL);
    return new Map(filtered);
  } catch {
    return new Map();
  }
}

function saveLocalStorageCache(cache: Map<string, { data: AddressSearchResult[]; ts: number }>): void {
  try {
    const entries = Array.from(cache.entries()).slice(-100);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export async function searchAndValidateAddress(
  query: string
): Promise<AddressSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const memCached = MEMORY_CACHE.get(trimmed);
  if (memCached && Date.now() - memCached.ts < MEMORY_CACHE_TTL) {
    return memCached.data;
  }

  const lsCache = loadLocalStorageCache();
  const lsCached = lsCache.get(trimmed);
  if (lsCached && Date.now() - lsCached.ts < LOCAL_CACHE_TTL) {
    MEMORY_CACHE.set(trimmed, lsCached);
    return lsCached.data;
  }

  if (!navigator.onLine) {
    if (lsCached) return lsCached.data;
    return [];
  }

  let results = await searchNominatim(trimmed);
  if (results.length === 0) {
    const normalized = normalizeAddress(trimmed);
    if (normalized !== trimmed) {
      results = await searchNominatim(normalized);
    }
  }

  const entry = { data: results, ts: Date.now() };
  MEMORY_CACHE.set(trimmed, entry);
  lsCache.set(trimmed, entry);
  saveLocalStorageCache(lsCache);

  return results;
}

async function searchNominatim(query: string): Promise<AddressSearchResult[]> {
  try {
    const now = Date.now();
    const wait = MIN_REQUEST_INTERVAL - (now - lastRequestTime);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastRequestTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query
    )}&countrycodes=kr&accept-language=ko&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SmartPhone-GPS-App/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 429) {
      logger.warn('Nominatim rate limited (429)');
      return [];
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }

    return list.map((item: NominatimResponse) => ({
      displayName: item.name || item.display_name?.split(',')[0] || '',
      formattedAddress: formatKoreanAddress(item),
      latitude: parseFloat(item.lat || '0'),
      longitude: parseFloat(item.lon || '0'),
      type: item.type,
    }));
  } catch (err) {
    logger.warn('Address validation search error', err);
    return [];
  }
}
