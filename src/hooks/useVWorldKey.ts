import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearVWorldKeyRecord,
  daysUntilExpiry,
  getVWorldKeyRecord,
  getVWorldKeyStatus,
  resolveActiveKey,
  saveVWorldKeyRecord,
  type VWorldKeyRecord,
  type VWorldKeyStatus,
} from '../services/vworldKeyService';
import { buildBaseTileLayer, type TileLayerConfig } from '../constants';

const STATUS_REFRESH_INTERVAL = 60 * 60 * 1000;

export interface UseVWorldKeyResult {
  record: VWorldKeyRecord | null;
  status: VWorldKeyStatus;
  daysLeft: number | null;
  tileConfig: TileLayerConfig;
  save: (key: string, expiresAt: number | null) => VWorldKeyRecord;
  clear: () => void;
}

const readStoredRecord = (): VWorldKeyRecord | null => {
  try {
    return getVWorldKeyRecord();
  } catch {
    return null;
  }
};

export function useVWorldKey(): UseVWorldKeyResult {
  const [record, setRecord] = useState<VWorldKeyRecord | null>(readStoredRecord);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), STATUS_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const save = useCallback((key: string, expiresAt: number | null) => {
    const saved = saveVWorldKeyRecord(key, expiresAt);
    setRecord(saved);
    setNow(Date.now());
    return saved;
  }, []);

  const clear = useCallback(() => {
    clearVWorldKeyRecord();
    setRecord(null);
    setNow(Date.now());
  }, []);

  const status = useMemo(() => getVWorldKeyStatus(record, now), [record, now]);
  const daysLeft = useMemo(() => daysUntilExpiry(record, now), [record, now]);

  // now가 매시간 갱신되므로 키 문자열로 메모한다 — now에 deps를 걸면 매시간 레이어가 재생성된다
const activeKey = resolveActiveKey(record, now);
  const tileConfig = useMemo(() => buildBaseTileLayer(activeKey), [activeKey]);

  return { record, status, daysLeft, tileConfig, save, clear };
}