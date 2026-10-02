import { StorageError } from '../types/errors';
import { logger } from '../utils/logger';
import { VWORLD_KEY_EXPIRY_WARN_DAYS } from '../constants';

const STORAGE_KEY = 'SMARTPHONE_GPS_VWORLD_KEY_V1';

export interface VWorldKeyRecord {
  key: string;
  expiresAt: number | null;
  savedAt: number;
}

export type VWorldKeyStatus = 'none' | 'active' | 'expiring' | 'expired';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidVWorldKeyFormat(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 10 && trimmed.length <= 64 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}

function isValidRecord(value: unknown): value is VWorldKeyRecord {
  if (typeof value !== 'object' || value === null) return false;
  const rec = value as Record<string, unknown>;
  if (typeof rec.key !== 'string' || !isValidVWorldKeyFormat(rec.key)) return false;
  if (typeof rec.savedAt !== 'number' || !Number.isFinite(rec.savedAt)) return false;
  if (rec.expiresAt === null) return true;
  return typeof rec.expiresAt === 'number' && Number.isFinite(rec.expiresAt);
}

export function getVWorldKeyRecord(): VWorldKeyRecord | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    logger.error('Failed to read VWorld key record', err);
    throw new StorageError('저장된 인증키를 불러오는데 실패했습니다.');
  }

  if (!raw) return null;

  // 파싱 실패는 저장소 장애가 아니라 복구 가능한 데이터 손상 — null을 돌려줘야 사용자가
// 설정 화면에서 새 키로 덮어쓸 수 있다. 원본에 키가 평문으로 있어 로깅하지 않는다.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn('Stored VWorld key record is not valid JSON and will be ignored');
    return null;
  }

  if (!isValidRecord(parsed)) {
    logger.warn('Stored VWorld key record is malformed and will be ignored');
    return null;
  }
  return parsed;
}

export function saveVWorldKeyRecord(key: string, expiresAt: number | null): VWorldKeyRecord {
  const normalized = key.trim();
  if (!isValidVWorldKeyFormat(normalized)) {
    throw new StorageError('인증키 형식이 올바르지 않습니다.');
  }
  const record: VWorldKeyRecord = { key: normalized, expiresAt, savedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (err) {
    logger.error('Failed to persist VWorld key record', err);
    throw new StorageError('인증키를 저장하는데 실패했습니다.');
  }
  return record;
}

export function clearVWorldKeyRecord(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.error('Failed to remove VWorld key record', err);
    throw new StorageError('인증키를 삭제하는데 실패했습니다.');
  }
}

/** 만료일 미입력(null)이면 active로 간주 — 무기한 키도 있으므로 */
export function daysUntilExpiry(record: VWorldKeyRecord | null, now: number = Date.now()): number | null {
  if (!record || record.expiresAt === null) return null;
  return Math.ceil((record.expiresAt - now) / DAY_MS);
}

export function getVWorldKeyStatus(
  record: VWorldKeyRecord | null,
  now: number = Date.now(),
): VWorldKeyStatus {
  if (!record) return 'none';
  if (record.expiresAt === null) return 'active';
  if (record.expiresAt <= now) return 'expired';
  const remaining = (record.expiresAt - now) / DAY_MS;
  return remaining <= VWORLD_KEY_EXPIRY_WARN_DAYS ? 'expiring' : 'active';
}

/** 만료된 키는 사용하지 않고 폴백 레이어로 내린다 */
export function resolveActiveKey(record: VWorldKeyRecord | null, now: number = Date.now()): string {
  if (!record) return '';
  if (getVWorldKeyStatus(record, now) === 'expired') {
    logger.warn('VWorld key is expired, falling back to OSM tiles');
    return '';
  }
  return record.key;
}