import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Edit3,
  Trash2,
  Share2,
  Clock,
  ChevronDown,
  ChevronUp,
  Route,
} from 'lucide-react';
import type { SavedPlace } from '../types/location';
import { getAccuracyInfo } from '../services/locationService';

interface PlaceItemProps {
  place: SavedPlace;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onRouteToThis?: () => void;
}

export const PlaceItem: React.FC<PlaceItemProps> = ({
  place,
  isSelected,
  onSelect,
  onNavigate,
  onEdit,
  onDelete,
  onShare,
  onRouteToThis,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const accuracyInfo = getAccuracyInfo(place.accuracy);

  const formattedDate = new Date(place.timestamp).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`rounded-2xl p-3.5 transition-all border ${
        isSelected
          ? 'bg-slate-800 border-blue-500 shadow-md shadow-blue-500/10'
          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
      }`}
      role="article"
      aria-label={place.customName}
    >
      {/* 카드 상단: 이름 & 시간 & 오차 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onSelect()}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {place.customName}
            </h4>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accuracyInfo.badgeClass}`}
              aria-label={`정확도: ±${place.accuracy}미터`}
            >
              ±{place.accuracy}m
            </span>
          </div>

          <p className="text-xs text-slate-300 truncate mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{place.originalAddress}</span>
          </p>

          {place.memo && (
            <p className="text-xs text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded-lg mt-1.5 inline-block">
              메모: {place.memo}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* 하단 액션 버튼 바 */}
      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={onNavigate}
            aria-label={`${place.customName}까지 길안내`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
            길안내
          </button>

          {onRouteToThis && (
            <button
              onClick={onRouteToThis}
              aria-label={`${place.customName}까지 도로 경로 보기`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Route className="w-3.5 h-3.5" aria-hidden="true" />
              경로
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            aria-label={`${place.customName} 이름 및 메모 변경`}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden xs:inline">이름</span>변경
          </button>

          <button
            onClick={onShare}
            aria-label={`${place.customName} 공유`}
            className="p-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Share2 className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </button>

          <button
            onClick={onDelete}
            aria-label={`${place.customName} 삭제`}
            className="p-1.5 rounded-xl bg-slate-700/80 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            aria-label={showDetails ? '상세 좌표 접기' : '상세 좌표 펼치기'}
            aria-expanded={showDetails}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-2 p-2 rounded-xl bg-slate-900/80 border border-slate-700/40 text-[11px] font-mono text-slate-400 space-y-0.5 animate-fade-in" role="region" aria-label="상세 좌표 정보">
          <div className="flex justify-between">
            <span>위도 (Lat):</span>
            <span className="text-slate-200 font-bold">{place.latitude.toFixed(6)}°</span>
          </div>
          <div className="flex justify-between">
            <span>경도 (Lng):</span>
            <span className="text-slate-200 font-bold">{place.longitude.toFixed(6)}°</span>
          </div>
          {place.altitude !== null && (
            <div className="flex justify-between">
              <span>고도:</span>
              <span className="text-slate-200">해발 {place.altitude}m</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
