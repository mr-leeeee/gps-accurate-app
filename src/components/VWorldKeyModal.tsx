import React from 'react';
import { X, KeyRound } from 'lucide-react';
import type { VWorldKeyRecord, VWorldKeyStatus } from '../services/vworldKeyService';
import { VWorldKeyForm } from './VWorldKeyForm';

interface VWorldKeyModalProps {
  isOpen: boolean;
  record: VWorldKeyRecord | null;
  status: VWorldKeyStatus;
  daysLeft: number | null;
  onClose: () => void;
  onSave: (key: string, expiresAt: number | null) => void;
  onClear: () => void;
}

export const VWorldKeyModal: React.FC<VWorldKeyModalProps> = ({
  isOpen,
  record,
  status,
  daysLeft,
  onClose,
  onSave,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">VWorld 인증키</h3>
              <p className="text-xs text-slate-400">국내 정밀 지도를 위한 개인 인증키</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="인증키 설정 닫기"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <VWorldKeyForm
          record={record}
          status={status}
          daysLeft={daysLeft}
          onSave={onSave}
          onClear={onClear}
          onClose={onClose}
        />
      </div>
    </div>
  );
};