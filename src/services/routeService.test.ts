import { describe, it, expect } from 'vitest';
import {
  formatDistance,
  formatDuration,
  calculateHaversineDistance,
} from './routeService';

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