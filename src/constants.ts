import type { LocationData, SavedPlace } from './types/location';
import { getEnvNumber } from './utils/env';

/**
 * GPS 정확도 임계값 (미터)
 */
export const ACCURACY_THRESHOLDS = {
  EXCELLENT: 5,
  GOOD: 15,
  FAIR: 30,
} as const;

/**
 * 기본 위치 (서울시청)
 */
export const DEFAULT_LOCATION: LocationData = {
  latitude: getEnvNumber('VITE_DEFAULT_LATITUDE', 37.566535),
  longitude: getEnvNumber('VITE_DEFAULT_LONGITUDE', 126.977969),
  accuracy: 5.0,
  altitude: 35.0,
  heading: null,
  speed: null,
  timestamp: Date.now(),
  address: '서울특별시 중구 태평로1가 세종대로 110 (서울시청 기준)',
  isMock: true,
};

/**
 * 테스트용 모의 위치 목록
 */
export const MOCK_LOCATIONS = [
  {
    name: '강남역',
    lat: 37.498095,
    lng: 127.02761,
    addr: '서울특별시 강남구 강남대로 390',
  },
  {
    name: '판교',
    lat: 37.402056,
    lng: 127.10862,
    addr: '경기도 성남시 분당구 판교역로 235',
  },
  {
    name: '해운대',
    lat: 35.158698,
    lng: 129.160384,
    addr: '부산광역시 해운대구 해운대해변로 264',
  },
] as const;

/**
 * 샘플 장소 목록 (최초 실행 시)
 */
export const SAMPLE_PLACES: SavedPlace[] = [
  {
    id: 'sample-1',
    customName: '서울시청 (기본 위치)',
    originalAddress: '서울특별시 중구 태평로1가 세종대로 110',
    latitude: 37.566535,
    longitude: 126.977969,
    accuracy: 5.0,
    altitude: 35.0,
    timestamp: Date.now(),
    memo: '테스트용 기본 장소입니다.',
  },
];

/**
 * 토스트 메시지 지속 시간 (밀리초)
 */
export const TOAST_DURATION = 2800;

/**
 * 복사 완료 상태 지속 시간 (밀리초)
 */
export const COPY_DURATION = 2000;
