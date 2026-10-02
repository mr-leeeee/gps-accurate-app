import React from 'react';
import { X, Trash2, RotateCcw, AlertTriangle, Undo2 } from 'lucide-react';
import type { TrashedPlace } from '../types/location';

interface TrashModalProps {
  trash: TrashedPlace[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
  onDeletePermanently: (id: string) => void;
  onEmptyTrash: () => void;
}

const formatDeletedAt = (deletedAt: number): string =>
  new Date(deletedAt).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const TrashModal: React.FC<TrashModalProps> = ({
  trash,
  isOpen,
  onClose,
  onRestore,
  onRestoreAll,
  onDeletePermanently,
  onEmptyTrash,
}) => {
  if (!isOpen) return null;

  const handleEmpty = () => {
    if (window.confirm('휴지통을 모두 비우면 복구할 수 없습니다. 계속하시겠습니까?')) {
      onEmptyTrash();
    }
  };

  const handleDeleteOne = (item: TrashedPlace) => {
    if (
      window.confirm(
        `'${item.place.customName}'을(를) 영구 삭제하시겠습니까? 되돌릴 수 없습니다.`
      )
    ) {
      onDeletePermanently(item.place.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-700/50 text-slate-300">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">휴지통</h3>
              <p className="text-xs text-slate-400">
                삭제된 장소 {trash.length}개 · 언제든지 되돌릴 수 있습니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="휴지통 닫기"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {trash.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={onRestoreAll}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold shadow-md transition"
            >
              <Undo2 className="w-4 h-4" />
              전체 되돌리기
            </button>
            <button
              onClick={handleEmpty}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-900/70 hover:bg-rose-800 active:scale-95 text-rose-200 text-xs font-bold border border-rose-700/60 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              휴지통 비우기
            </button>
          </div>
        )}

        <div className="mt-3 max-h-[52vh] overflow-y-auto pr-1">
          {trash.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-800/40 rounded-xl border border-dashed border-slate-700/60">
              <Trash2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">휴지통이 비어 있습니다</p>
              <p className="text-xs text-slate-500 mt-1">
                삭제한 장소가 여기에 쌓이고, 원하면 다시 되돌릴 수 있습니다.
              </p>
            </div>
          ) : (
            <ul role="list" aria-label="휴지통 목록" className="space-y-2">
              {trash.map((item) => (
                <li
                  key={item.place.id}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-100 truncate">
                        {item.place.customName}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.place.originalAddress}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        삭제 {formatDeletedAt(item.deletedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onRestore(item.place.id)}
                        aria-label={`${item.place.customName} 되돌리기`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold transition active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        되돌리기
                      </button>
                      <button
                        onClick={() => handleDeleteOne(item)}
                        aria-label={`${item.place.customName} 영구 삭제`}
                        className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {trash.length > 0 && (
          <p className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            휴지통 내용은 스마트폰 안에 저장됩니다. 앱을 다시 꺼도 유지되며, '영구 삭제' 또는
            '휴지통 비우기'를 해야만 완전히 사라집니다.
          </p>
        )}
      </div>
    </div>
  );
};