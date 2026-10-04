import { describe, it, expect } from 'vitest';
import { parseTags, formatTags, MAX_TAGS_PER_PLACE } from './placeTags';

describe('parseTags', () => {
  it('쉼표로 나누고 앞뒤 공백을 제거한다', () => {
    expect(parseTags('집, 회사, 약속')).toEqual(['집', '회사', '약속']);
  });

  it('빈 항목을 버린다', () => {
    expect(parseTags('집,, ,회사,')).toEqual(['집', '회사']);
  });

  it('중복을 순서대로 제거한다', () => {
    expect(parseTags('집, 회사, 집, 회사')).toEqual(['집', '회사']);
  });

  it('개수 상한을 지킨다', () => {
    const many = Array.from({ length: MAX_TAGS_PER_PLACE + 5 }, (_, i) => `t${i}`).join(',');
    expect(parseTags(many)).toHaveLength(MAX_TAGS_PER_PLACE);
  });

  it('빈 입력은 빈 배열을 반환한다', () => {
    expect(parseTags('')).toEqual([]);
    expect(parseTags('   ')).toEqual([]);
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
});

describe('formatTags', () => {
  it('쉼표+공백으로 연결한다', () => {
    expect(formatTags(['집', '회사'])).toBe('집, 회사');
  });

  it('없으면 빈 문자열을 반환한다', () => {
    expect(formatTags(undefined)).toBe('');
    expect(formatTags([])).toBe('');
  });
});
