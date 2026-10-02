import React, { useState } from 'react';
import {
  ExternalLink,
  AlertCircle,
  CalendarClock,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import type { VWorldKeyRecord, VWorldKeyStatus } from '../services/vworldKeyService';
import { isValidVWorldKeyFormat } from '../services/vworldKeyService';
import { VWORLD_LINKS } from '../constants';
import { AppError } from '../types/errors';

interface VWorldKeyFormProps {
  record: VWorldKeyRecord | null;
  status: VWorldKeyStatus;
  daysLeft: number | null;
  onSave: (key: string, expiresAt: number | null) => void;
  onClear: () => void;
  onClose: () => void;
}

const toDateInputValue = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toEndOfDay = (dateValue: string): number | null => {
  const parts = dateValue.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (y < 2000 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const STATUS_META: Record<VWorldKeyStatus, { label: string; className: string }> = {
  none: { label: '미설정', className: 'bg-slate-700/50 text-slate-300 border-slate-600/60' },
  active: { label: '사용 중', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  expiring: { label: '만료 임박', className: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  expired: { label: '만료됨', className: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

export const VWorldKeyForm: React.FC<VWorldKeyFormProps> = ({
  record,
  status,
  daysLeft,
  onSave,
  onClear,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState(record?.key ?? '');
  const [dateInput, setDateInput] = useState(
    record?.expiresAt != null ? toDateInputValue(record.expiresAt) : '',
  );
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[status];

  const handleSave = () => {
    setError(null);
    const normalized = keyInput.trim().toUpperCase();
    if (!normalized) {
      setError('인증키를 입력해주세요.');
      return;
    }
    if (!isValidVWorldKeyFormat(normalized)) {
      setError('인증키 형식이 올바르지 않습니다. VWorld 발급 키를 그대로 붙여넣어주세요.');
      return;
    }

    let expiresAt: number | null = null;
    if (dateInput) {
      expiresAt = toEndOfDay(dateInput);
      if (expiresAt === null) {
        setError('만료일 형식이 올바르지 않습니다.');
        return;
      }
    }

    try {
      onSave(normalized, expiresAt);
      onClose();
    } catch (err) {
      setError(err instanceof AppError ? err.userMessage : '인증키 저장에 실패했습니다.');
    }
  };

  const handleClear = () => {
    if (!window.confirm('저장된 인증키를 삭제하시겠습니까? OSM 기본 지도로 되돌아갑니다.')) return;
    onClear();
    onClose();
  };

  const openLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="overflow-y-auto flex-1 my-3 space-y-3 pr-1">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
          <span className="text-xs text-slate-400">현재 상태</span>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.className}`}>
            {meta.label}
            {status === 'expiring' && daysLeft !== null && ` · ${daysLeft}일 남음`}
            {status === 'expired' && ' · OSM 지도로 전환됨'}
          </span>
        </div>

        {status === 'expiring' && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              인증키가 곧 만료됩니다. 브이월드 「인증키 발급」에서 연장한 뒤 만료일을 갱신해주세요.
            </span>
          </div>
        )}

        {status === 'expired' && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>인증키가 만료되어 OSM 기본 지도로 표시 중입니다. 새 키를 등록하거나 연장하세요.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">인증키</label>
          <div className="flex items-center gap-2">
            <input
              type={revealed ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
            <button
              onClick={() => setRevealed((prev) => !prev)}
              aria-label={revealed ? '인증키 숨기기' : '인증키 보기'}
              title={revealed ? '인증키 숨기기' : '인증키 보기'}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition shrink-0"
            >
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            브이월드 「오픈API → 인증키 발급」에서 받은 키를 붙여넣으세요.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            만료일 <span className="font-normal text-slate-500">(선택)</span>
          </label>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
          />
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
            입력하면 만료 임박 시 경고를 표시합니다. 브이월드 「인증키 관리」에서 확인 가능합니다.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => openLink(VWORLD_LINKS.portal)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md transition"
          >
            <span>브이월드에서 인증키 발급받기</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </button>
          <button
            onClick={() => openLink(VWORLD_LINKS.signup)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <span>회원이 없다면 브이월드 가입</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <p className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500/70" />
          입력한 인증키는 이 스마트폰 안에만 저장되며 외부로 전송되지 않습니다. 앱을 재설치하면
          함께 삭제됩니다.
        </p>
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
        {record ? (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 active:scale-95 text-rose-200 text-xs font-bold border border-rose-700/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            저장
          </button>
        </div>
      </div>
    </>
  );
};