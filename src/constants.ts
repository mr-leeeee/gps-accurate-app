import type { LocationData, SavedPlace } from './types/location';
import { getEnvNumber, getEnvString } from './utils/env';

/**
 * 고스트 모드 (개발 전용 기능)
 *
 * `pnpm build:ghost` (= VITE_GHOST_MODE=1) 로 빌드할 때만 테스트 도구가
 * 활성화됩니다. 일반 빌드에서는 Vite가 이 값을 리터럴로 치환해 상수로 만들고,
 * `GHOST_MODE === false` 분기가 정적으로 제거되어 번들에 코드 자체가 남지 않습니다.
 *
 * production에서 제외되는 것:
 *   - 테스트 위치 패널 (강남역/판교/해운대)
 *   - 저장 목록 최초 실행 시 샘플 장소 주입
 *   - GPS 측정 실패 시 기본 좌표(서울시청) 폴백
 */
export const GHOST_MODE = import.meta.env.VITE_GHOST_MODE === '1';

/**
 * VWorld(공간정보 오픈플랫폼) 인증키
 *
 * 미설정 시 아래의 OSM 기반 기본 타일로 폴백합니다.
 * 발급: https://www.vworld.kr → 오픈API → 인증키 신청 (무료, 즉시 발급)
 */
export const VWORLD_TILE_KEY = getEnvString('VITE_VWORLD_TILE_KEY', '');

/**
 * 기본 지도 레이어
 *
 * 인증키가 있으면 VWorld(국내 관제 데이터), 없으면 OSM 기반 CartoDB로 폴백합니다.
 *
 * 경로 순서는 반드시 `{z}/{y}/{x}` 입니다. VWorld의 tileRow/tileCol이 각각
 * Google 인덱스 Y/X라 Leaflet의 {y}/{x}에 대응하지만, 관례대로
 * `{z}/{x}/{y}`로 바꾸면 404가 되고 지도가 깨집니다. Base 레이어는 zoom 6~19.
 */
export const BASE_TILE_LAYER = VWORLD_TILE_KEY
  ? {
      url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_TILE_KEY}/Base/{z}/{y}/{x}.png`,
      minZoom: 6,
      maxZoom: 19,
      attribution: '공간정보 오픈플랫폼(브이월드) · 국토교통부',
    }
  : {
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      minZoom: 0,
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    };

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
 * 실행 취소 액션이 포함된 토스트의 지속 시간 (밀리초)
 */
export const UNDO_TOAST_DURATION = 6000;

/**
 * 복사 완료 상태 지속 시간 (밀리초)
 */
export const COPY_DURATION = 2000;
