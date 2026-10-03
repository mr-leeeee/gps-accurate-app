import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyLocationText, shareLocation, navigateTo, openRealdex, openRealdexWithAddress } from './navigationService';

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

  it('openRealdex - vshot 게이트와 좌표를 담은 URL을 연다', () => {
    const open = vi.fn();
    vi.stubGlobal('window', { open });

    openRealdex(mockTarget);

    expect(open).toHaveBeenCalledWith(
      'https://realdex.kr/map.html?vshot=1&vla=37.50005&vlo=127.0365&vz=16',
      '_blank'
    );
  });

  it('openRealdexWithAddress - 주소를 먼저 복사한 뒤 지도를 열고 true 반환', async () => {
    const order: string[] = [];
    const writeText = vi.fn().mockImplementation(async () => {
      order.push('copy');
    });
    const open = vi.fn().mockImplementation(() => {
      order.push('open');
    });
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('window', { open });

    const result = await openRealdexWithAddress(mockTarget);

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith(mockTarget.address);
    expect(order).toEqual(['copy', 'open']);
  });

  it('openRealdexWithAddress - 복사 실패 시에도 지도는 열고 false 반환', async () => {
    const open = vi.fn();
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    vi.stubGlobal('window', { open });

    const result = await openRealdexWithAddress(mockTarget);

    expect(result).toBe(false);
    expect(open).toHaveBeenCalled();
  });

  it('openRealdexWithAddress - 주소가 없으면 복사 없이 지도를 연다', async () => {
    const writeText = vi.fn();
    const open = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('window', { open });

    const result = await openRealdexWithAddress({
      ...mockTarget,
      address: undefined,
    });

    expect(result).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalled();
  });
});