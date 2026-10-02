import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearVWorldKeyRecord,
  daysUntilExpiry,
  getVWorldKeyRecord,
  getVWorldKeyStatus,
  isValidVWorldKeyFormat,
  resolveActiveKey,
  saveVWorldKeyRecord,
  type VWorldKeyRecord,
} from './vworldKeyService';
import { StorageError } from '../types/errors';
import { VWORLD_KEY_EXPIRY_WARN_DAYS } from '../constants';

const DAY = 24 * 60 * 60 * 1000;
const VALID_KEY = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
const STORAGE_KEY = 'SMARTPHONE_GPS_VWORLD_KEY_V1';

const record = (expiresAt: number | null): VWorldKeyRecord => ({
  key: VALID_KEY,
  expiresAt,
  savedAt: 1_700_000_000_000,
});

describe('vworldKeyService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidVWorldKeyFormat', () => {
    it('UUID 형태 키를 허용', () => {
      expect(isValidVWorldKeyFormat(VALID_KEY)).toBe(true);
    });

    it('공백을 surrounding 무시하고 대문자 소문자를 구분하지 않음', () => {
      expect(isValidVWorldKeyFormat(`  ${VALID_KEY.toLowerCase()}  `)).toBe(true);
    });

    it('공백·특수문자가 섞인 값은 거부', () => {
      expect(isValidVWorldKeyFormat('abc def')).toBe(false);
      expect(isValidVWorldKeyFormat('<script>alert(1)</script>')).toBe(false);
    });

    it('너무 짧은 값은 거부', () => {
      expect(isValidVWorldKeyFormat('abc')).toBe(false);
    });
  });

  describe('저장 및 조회', () => {
    it('미설정 상태는 null을 반환', () => {
      expect(getVWorldKeyRecord()).toBeNull();
    });

    it('저장 후 동일한 레코드를 반환하고 앞뒤 공백이 제거됨', () => {
      const saved = saveVWorldKeyRecord(`  ${VALID_KEY}  `, null);
      expect(saved.key).toBe(VALID_KEY);
      expect(getVWorldKeyRecord()).toEqual(saved);
    });

    it('만료일 epoch-ms로 보존', () => {
      const expiresAt = 1_800_000_000_000;
      saveVWorldKeyRecord(VALID_KEY, expiresAt);
      expect(getVWorldKeyRecord()?.expiresAt).toBe(expiresAt);
    });

    it('형식이 잘못된 키 저장은 StorageError', () => {
      expect(() => saveVWorldKeyRecord('nope', null)).toThrow(StorageError);
    });

    it('저장된 값이 깨져 있으면 무시하고 null 반환', () => {
      localStorage.setItem(STORAGE_KEY, '{"key":"x"}');
      expect(getVWorldKeyRecord()).toBeNull();
    });

    it('JSON이 아니어도 null 반환', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(getVWorldKeyRecord()).toBeNull();
    });

    it('삭제 후에는 null을 반환', () => {
      saveVWorldKeyRecord(VALID_KEY, null);
      clearVWorldKeyRecord();
      expect(getVWorldKeyRecord()).toBeNull();
    });
  });

  describe('getVWorldKeyStatus', () => {
    const now = 1_800_000_000_000;

    it('레코드가 없으면 none', () => {
      expect(getVWorldKeyStatus(null, now)).toBe('none');
    });

    it('만료일 미입력(null)이면 active', () => {
      expect(getVWorldKeyStatus(record(null), now)).toBe('active');
    });

    it(`${VWORLD_KEY_EXPIRY_WARN_DAYS}일 이상 남으면 active`, () => {
      expect(getVWorldKeyStatus(record(now + 30 * DAY), now)).toBe('active');
    });

    it(`경고 기준(${VWORLD_KEY_EXPIRY_WARN_DAYS}일) 이하면 expiring`, () => {
      expect(getVWorldKeyStatus(record(now + 10 * DAY), now)).toBe('expiring');
    });

    it('경고 경계값 당일도 expiring', () => {
      const boundary = now + VWORLD_KEY_EXPIRY_WARN_DAYS * DAY;
      expect(getVWorldKeyStatus(record(boundary), now)).toBe('expiring');
    });

    it('현재 시각과 같으면 expired', () => {
      expect(getVWorldKeyStatus(record(now), now)).toBe('expired');
    });

    it('과거 날짜면 expired', () => {
      expect(getVWorldKeyStatus(record(now - DAY), now)).toBe('expired');
    });
  });

  describe('daysUntilExpiry', () => {
    const now = 1_800_000_000_000;

    it('만료일 미입력이면 null', () => {
      expect(daysUntilExpiry(record(null), now)).toBeNull();
    });

    it('레코드가 없으면 null', () => {
      expect(daysUntilExpiry(null, now)).toBeNull();
    });

    it('남은 일수를 올림하여 반환', () => {
      expect(daysUntilExpiry(record(now + 10.2 * DAY), now)).toBe(11);
    });

    it('만료 이후에는 음수 반환', () => {
      expect(daysUntilExpiry(record(now - 2 * DAY), now)).toBe(-2);
    });
  });

  describe('resolveActiveKey', () => {
    const now = 1_800_000_000_000;

    it('레코드가 없으면 빈 문자열(OSM 폴백)', () => {
      expect(resolveActiveKey(null, now)).toBe('');
    });

    it('유효한 키는 그대로 반환', () => {
      expect(resolveActiveKey(record(now + 30 * DAY), now)).toBe(VALID_KEY);
    });

    it('만료된 키는 빈 문자열로 폴백', () => {
      expect(resolveActiveKey(record(now - DAY), now)).toBe('');
    });

    it('만료 임박 상태는 계속 사용', () => {
      expect(resolveActiveKey(record(now + 3 * DAY), now)).toBe(VALID_KEY);
    });
  });
});