import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyLocationText, shareLocation, navigateTo } from './navigationService';

const mockTarget = {
  name: '테스트 장소',
  latitude: 37.50005,
  longitude: 127.0365,
  address: '서울특별시 강남구 테헤란로 152',
};

describe('navigationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('copyLocationText 성공 시 true 반환', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const result = await copyLocationText(mockTarget);
    expect(result).toBe(true);
  });

  it('copyLocationText 실패 시 false 반환', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('fail')),
      },
    });

    const result = await copyLocationText(mockTarget);
    expect(result).toBe(false);
  });

  it('shareLocation - navigator.share 미지원 시 클립보드 복사로 대체', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      share: undefined,
    });

    const result = await shareLocation(mockTarget);
    expect(result).toBe(true);
  });

  it('shareLocation - AbortError 시 false 반환', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(abortError),
      canShare: vi.fn().mockReturnValue(true),
    });

    const result = await shareLocation(mockTarget);
    expect(result).toBe(false);
  });

  it('navigateTo - kakao 호출 시 에러 없음', () => {
    vi.stubGlobal('window', { open: vi.fn(), location: { href: '' } });
    expect(() => navigateTo('kakao', mockTarget)).not.toThrow();
  });
});