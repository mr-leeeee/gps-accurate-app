import React, { useState } from 'react';
import { Search, MapPin, Download, Trash, Layers, Route, Plus } from 'lucide-react';
import type { SavedPlace } from '../types/location';
import { PlaceItem } from './PlaceItem';
import { exportPlacesToJSON } from '../services/storageService';

interface PlaceListProps {
  places: SavedPlace[];
  selectedPlace: SavedPlace | null;
  onSelectPlace: (place: SavedPlace) => void;
  onNavigatePlace: (place: SavedPlace) => void;
  onEditPlace: (place: SavedPlace) => void;
  onDeletePlace: (id: string) => void;
  onClearAllPlaces: () => void;
  onSharePlace: (place: SavedPlace) => void;
  onRouteToPlace?: (place: SavedPlace) => void;
  onOpenRouteOptimizer?: () => void;
  onOpenAddAddressModal?: () => void;
}

export const PlaceList: React.FC<PlaceListProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onNavigatePlace,
  onEditPlace,
  onDeletePlace,
  onClearAllPlaces,
  onSharePlace,
  onRouteToPlace,
  onOpenRouteOptimizer,
  onOpenAddAddressModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = places.filter(
    (p) =>
      p.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.memo && p.memo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    const jsonStr = exportPlacesToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GPS_장소목록_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    if (window.confirm('정말 저장된 모든 장소 목록을 삭제하시겠습니까?')) {
      onClearAllPlaces();
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-700/70">
      {/* 목록 헤더 & 카운트 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              저장된 장소 목록
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {places.length}개
              </span>
            </h3>
            <p className="text-xs text-slate-400">버튼을 눌러 기록한 위치 목록입니다</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAddAddressModal && (
            <button
              onClick={onOpenAddAddressModal}
              aria-label="도로명 또는 지번 주소 직접 입력"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>주소 추가</span>
            </button>
          )}

          {places.length > 0 && onOpenRouteOptimizer && (
            <button
              onClick={onOpenRouteOptimizer}
              aria-label="최적 동선 계산"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Route className="w-3.5 h-3.5" aria-hidden="true" />
              <span>최적 동선</span>
            </button>
          )}

          {places.length > 0 && (
            <>
              <button
                onClick={handleExport}
                aria-label="장소 목록 백업 다운로드"
                className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleClearAll}
                aria-label="전체 장소 삭제"
                className="p-1.5 rounded-lg bg-slate-700/70 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <Trash className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 검색 입력창 */}
      {places.length > 1 && (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="장소명, 주소, 메모로 검색..."
            aria-label="장소 검색"
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 장소 목록 렌더링 */}
      <div role="list" aria-label="저장된 장소 목록">
        {filteredPlaces.length > 0 ? (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlaces.map((place) => (
              <div role="listitem" key={place.id}>
                <PlaceItem
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={() => onSelectPlace(place)}
                  onNavigate={() => onNavigatePlace(place)}
                  onEdit={() => onEditPlace(place)}
                  onDelete={() => {
                    if (window.confirm(`'${place.customName}' 장소를 삭제하시겠습니까?`)) {
                      onDeletePlace(place.id);
                    }
                  }}
                  onShare={() => onSharePlace(place)}
                  onRouteToThis={() => onRouteToPlace?.(place)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60">
            <MapPin className="w-8 h-8 text-slate-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-300">
              {searchQuery ? '검색된 장소가 없습니다.' : '저장된 장소가 없습니다.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              상단에서 [장소 목록에 저장]을 누르거나, 아래 버튼으로 주소를 직접 입력해 보세요.
            </p>
            {onOpenAddAddressModal && (
              <button
                onClick={onOpenAddAddressModal}
                aria-label="주소 직접 입력"
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>주소 직접 입력하기</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
