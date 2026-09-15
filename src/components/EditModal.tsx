import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, Tag } from 'lucide-react';
import type { SavedPlace } from '../types/location';

interface EditModalProps {
  place: SavedPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newName: string, newMemo?: string) => void;
}

const PRESET_NAMES = [
  '🚗 내 차 주차 위치',
  '📍 약속 장소',
  '🏢 업무/미팅 장소',
  '🎣 낚시/등산 포인트',
  '🏕️ 캠핑 차박지',
  '🏠 우리집/숙소',
  '☕ 단골 카페',
];

export const EditModal: React.FC<EditModalProps> = ({
  place,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (place) {
      setName(place.customName);
      setMemo(place.memo || '');
    }
  }, [place]);

  if (!isOpen || !place) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(place.id, name.trim(), memo.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 transform transition-all">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">장소 이름 및 정보 변경</h3>
              <p className="text-xs text-slate-400">원하는 이름으로 자유롭게 변경하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 장소 이름 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              장소 이름 (별칭)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 내 차 주차 위치, 강남역 미팅"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 빠른 추천 프리셋 */}
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5 font-medium">
              <Tag className="w-3.5 h-3.5" />
              <span>자주 쓰는 이름 추천:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_NAMES.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setName(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/60 transition active:scale-95"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 입력 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              추가 메모 (선택)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 지하 2층 B-03 기둥 앞, 오후 5시 만남"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* 기본 주소 참고 표시 */}
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-400">
            <span className="text-[10px] text-slate-500 block">측정된 도로명 주소:</span>
            <span className="text-slate-300">{place.originalAddress}</span>
          </div>

          {/* 액션 버튼 */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              변경 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
