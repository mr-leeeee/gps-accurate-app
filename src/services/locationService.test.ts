import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAccuracyInfo, normalizeAddress, searchAndValidateAddress, reverseGeocode } from './locationService';

describe('getAccuracyInfo', () => {
  it('excellent 레벨 반환 (≤5m)', () => {
    const result = getAccuracyInfo(3.5);
    expect(result.level).toBe('excellent');
    expect(result.text).toContain('3.5');
  });

  it('good 레벨 반환 (6-15m)', () => {
    const result = getAccuracyInfo(10);
    expect(result.level).toBe('good');
    expect(result.text).toContain('10.0');
  });

  it('fair 레벨 반환 (16-30m)', () => {
    const result = getAccuracyInfo(25);
    expect(result.level).toBe('fair');
  });

  it('poor 레벨 반환 (>30m)', () => {
    const result = getAccuracyInfo(50);
    expect(result.level).toBe('poor');
  });

  it('정확도 0일 때 excellent', () => {
    const result = getAccuracyInfo(0);
    expect(result.level).toBe('excellent');
  });

  it('정확도 5일 때 excellent 경계값', () => {
    const result = getAccuracyInfo(5);
    expect(result.level).toBe('excellent');
  });

  it('정확도 5.1일 때 good', () => {
    const result = getAccuracyInfo(5.1);
    expect(result.level).toBe('good');
  });
});

describe('normalizeAddress', () => {
  it('도로명 + 건물번호 사이 띄어쓰기 추가', () => {
    expect(normalizeAddress('황금3로7번길56')).toBe('황금3로7번길 56');
  });

  it('강남대로 뒤 숫자 띄어쓰기', () => {
    expect(normalizeAddress('강남대로390')).toBe('강남대로 390');
  });

  it('테헤란로 뒤 숫자 띄어쓰기', () => {
    expect(normalizeAddress('테헤란로152')).toBe('테헤란로 152');
  });

  it('변경 없어야 함 — 이미 정상', () => {
    expect(normalizeAddress('서울특별시 중구 세종대로')).toBe('서울특별시 중구 세종대로');
  });

  it('공백만 있는 경우', () => {
    expect(normalizeAddress('   ')).toBe('');
  });

  it('번지 포함 — 띄어쓰기 없어야 함', () => {
    expect(normalizeAddress('세종대로110번지')).toBe('세종대로110번지');
  });
});

describe('searchAndValidateAddress', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('빈 입력 반환', async () => {
    const result = await searchAndValidateAddress('');
    expect(result).toEqual([]);
  });

  it('API 성공 시 결과 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          name: '학운4일반산업단지',
          display_name: '56, 황금3로7번길, 김포시',
          lat: '37.61294',
          lon: '126.61720',
          type: 'building',
        },
      ],
    });

    const result = await searchAndValidateAddress('황금3로7번길56');
    expect(result.length).toBe(1);
    expect(result[0].latitude).toBeCloseTo(37.61294);
  });

  it('API 실패 시 빈 배열 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await searchAndValidateAddress('테스트주소');
    expect(result).toEqual([]);
  });
});

describe('reverseGeocode', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('성공 시 한국식 주소 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        display_name: '대한민국 경기도 김포시',
        address: {
          country: '대한민국',
          province: '경기도',
          city: '김포시',
          road: '황금3로',
        },
      }),
    });

    const result = await reverseGeocode(37.61294, 126.61720);
    expect(result).toContain('경기도');
    expect(result).toContain('김포시');
  });

  it('API 실패 시 좌표 문자열 반환', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const result = await reverseGeocode(37.61294, 126.61720);
    expect(result).toContain('37.61294');
    expect(result).toContain('126.61720');
  });

  it('fetch 에러 시 좌표 문자열 반환', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await reverseGeocode(37.5665, 126.978);
    expect(result).toContain('37.56650');
  });
});