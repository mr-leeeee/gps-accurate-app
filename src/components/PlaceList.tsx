import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  Download,
  Trash,
  Layers,
  Route,
  Plus,
  Upload,
  Undo2,
} from 'lucide-react';
import type { SavedPlace, LocationData } from '../types/location';
import { calculateHaversineDistance } from '../services/routeService';
import { PlaceItem } from './PlaceItem';

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
  onOpenTrash?: () => void;
  onImportBackup?: (json: string) => boolean;
  onExportBackup?: () => Promise<void>;
  trashCount?: number;
  currentLocation?: LocationData | null;
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
  onOpenTrash,
  onImportBackup,
  onExportBackup,
  trashCount = 0,
  currentLocation = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'newest' | 'name' | 'distance'>('newest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPlaces = places.filter(
    (p) =>
      p.customName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.memo && p.memo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) {
      for (const t of p.tags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .map(([tag]) => tag);
  }, [places]);

  const tagFilteredPlaces = selectedTag
    ? filteredPlaces.filter((p) => (p.tags ?? []).includes(selectedTag))
    : filteredPlaces;

  const sortedPlaces = [...tagFilteredPlaces].sort((a, b) => {
    if (sortMode === 'name') {
      return a.customName.localeCompare(b.customName, 'ko');
    }
    if (sortMode === 'distance' && currentLocation) {
      const da = calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        a.latitude,
        a.longitude
      );
      const db = calculateHaversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        b.latitude,
        b.longitude
      );
      return da - db;
    }
    return 0;
  });

  const handlePickBackupFile = () => {
    fileInputRef.current?.click();
  };

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onImportBackup) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
    };
    reader.onerror = () => {
      window.alert('파일을 읽지 못했습니다. 다시 시도해주세요.');
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (window.confirm('모든 장소를 휴지통으로 옮기시겠습니까?\n휴지통에서 되돌릴 수 있습니다.')) {
      onClearAllPlaces();
    }
  };

  const handleDeleteOne = (place: SavedPlace) => {
    if (
      window.confirm(
        `'${place.customName}'을(를) 삭제할까요?\n휴지통에서 되돌릴 수 있습니다.`
      )
    ) {
      onDeletePlace(place.id);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-700/70">
      {/* 목록 툴바 - 아이콘 + 개수 배지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-800">
              {places.length}
            </span>
          </div>
          <span className="sr-only">저장된 장소 {places.length}개</span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenAddAddressModal && (
            <button
              onClick={onOpenAddAddressModal}
              aria-label="도로명 또는 지번 주소 직접 입력"
              title="주소 추가"
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {places.length > 0 && onOpenRouteOptimizer && (
            <button
              onClick={onOpenRouteOptimizer}
              aria-label="최적 동선 계산"
              title="최적 동선"
              className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Route className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {onOpenTrash && (
            <button
              onClick={onOpenTrash}
              aria-label={`휴지통 열기${trashCount > 0 ? `, 삭제된 장소 ${trashCount}개` : ''}`}
              title="휴지통"
              className="relative p-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <Undo2 className="w-4 h-4" aria-hidden="true" />
              {trashCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-slate-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          {onExportBackup && places.length > 0 && (
            <button
              onClick={onExportBackup}
              aria-label="장소 목록 백업 파일 만들기"
              title="백업 파일 만들기"
              className="p-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {onImportBackup && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleBackupFileChange}
                className="hidden"
                aria-label="백업 파일 선택"
              />
              <button
                onClick={handlePickBackupFile}
                aria-label="백업 파일에서 장소 목록 불러오기"
                title="백업 파일 불러오기"
                className="p-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}

          {places.length > 0 && (
            <button
              onClick={handleClearAll}
              aria-label="전체 장소를 휴지통으로 옮기기"
              title="전체 삭제"
              className="p-2 rounded-xl bg-slate-700/70 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <Trash className="w-4 h-4" aria-hidden="true" />
            </button>
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

      {/* 정렬 방식 */}
      {places.length > 1 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400">
            {sortedPlaces.length}개{searchQuery ? ' 검색됨' : ''}
          </span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'newest' | 'name' | 'distance')}
            aria-label="장소 정렬 방식"
            className="px-2 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-blue-500"
          >
            <option value="newest">최신순</option>
            <option value="name">이름순</option>
            <option value="distance" disabled={!currentLocation}>
              거리순{currentLocation ? '' : ' (위치 필요)'}
            </option>
          </select>
        </div>
      )}

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div
          className="flex gap-1.5 mb-2 overflow-x-auto pb-1"
          role="group"
          aria-label="태그 필터"
        >
          <button
            onClick={() => setSelectedTag(null)}
            aria-pressed={selectedTag === null}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition active:scale-95 ${
              selectedTag === null
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            전체
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              aria-pressed={selectedTag === tag}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition active:scale-95 ${
                selectedTag === tag
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 장소 목록 렌더링 */}
      <div role="list" aria-label="저장된 장소 목록">
        {sortedPlaces.length > 0 ? (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {sortedPlaces.map((place) => (
              <div role="listitem" key={place.id}>
                <PlaceItem
                  place={place}
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={() => onSelectPlace(place)}
                  onNavigate={() => onNavigatePlace(place)}
                  onEdit={() => onEditPlace(place)}
                  onDelete={() => handleDeleteOne(place)}
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
