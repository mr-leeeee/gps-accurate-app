export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number; // 미터 단위 오차 범위 (±m)
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  address?: string;
  isMock?: boolean;
}

export interface SavedPlace {
  id: string;
  customName: string;      // 사용자 지정 장소명 (예: "내 차 주차 위치", "접선 장소")
  originalAddress: string; // 역지오코딩된 기본 주소
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;       // 저장된 시각 (ms)
  memo?: string;
  tags?: string[];
}

export type AccuracyLevel = 'excellent' | 'good' | 'fair' | 'poor';

export interface AccuracyInfo {
  level: AccuracyLevel;
  text: string;
  color: string;
  badgeClass: string;
  description: string;
}
