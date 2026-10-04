import { describe, it, expect } from 'vitest';
import { extractShortAddress, buildDefaultPlaceName } from './placeName';

describe('extractShortAddress', () => {
  it('뒤쪽 2토큰(동 + 도로명)을 반환한다', () => {
    expect(extractShortAddress('검단구 인천광역시 불로대곡동 검단로744번1길')).toBe(
      '불로대곡동 검단로744번1길'
    );
  });

  it('대한민국 접두사가 있어도 뒤쪽만 취한다', () => {
    expect(
      extractShortAddress('대한민국 인천광역시 서구 검단동 검단로')
    ).toBe('검단동 검단로');
  });

  it('토큰이 2개 미만이면 전체를 반환한다', () => {
    expect(extractShortAddress('서울특별시 강남구')).toBe('서울특별시 강남구');
    expect(extractShortAddress('강남')).toBe('강남');
  });

  it('20자를 초과하면 자른다', () => {
    const long = '대한민국 어떤아주긴광역시 어떤아주긴구 어떤아주긴동 어떤아주긴로123번길';
    const result = extractShortAddress(long);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it('빈 문자열/undefined/null이면 빈 문자열을 반환한다', () => {
    expect(extractShortAddress('')).toBe('');
    expect(extractShortAddress('   ')).toBe('');
    expect(extractShortAddress(undefined)).toBe('');
    expect(extractShortAddress(null)).toBe('');
  });
});

describe('buildDefaultPlaceName', () => {
  it('주소가 있으면 식별 가능한 이름을 만든다', () => {
    expect(
      buildDefaultPlaceName('검단구 인천광역시 불로대곡동 검단로744번1길', 47, '08:19')
    ).toBe('불로대곡동 검단로744번1길 (08:19)');
  });

  it('주소가 없으면 기존 형식으로 폴백한다', () => {
    expect(buildDefaultPlaceName('', 47, '08:19')).toBe('장소 47 (08:19)');
    expect(buildDefaultPlaceName(undefined, 3, '14:00')).toBe('장소 3 (14:00)');
  });
});
