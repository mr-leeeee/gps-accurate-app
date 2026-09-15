import React, { useState } from 'react';
import {
  X,
  Route,
  Clock,
  Navigation,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { SavedPlace, LocationData } from '../types/location';
import {
  optimizeMultiStops,
  formatDistance,
  formatDuration,
} from '../services/routeService';
import type { MultiRouteResult } from '../services/routeService';
import { openKakaoMap, openMultiStopNavigation } from '../services/navigationService';

interface RouteOptimizeModalProps {
  currentLocation: LocationData | null;
  savedPlaces: SavedPlace[];
  isOpen: boolean;
  onClose: () => void;
  onApplyRouteToMap: (
    coordinates: [number, number][],
    stopOrders: Record<string, number>
  ) => void;
}

export const RouteOptimizeModal: React.FC<RouteOptimizeModalProps> = ({
  currentLocation,
  savedPlaces,
  isOpen,
  onClose,
  onApplyRouteToMap,
}) => {
  // 선택된 장소 ID 목록 (기본은 전체 선택)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    savedPlaces.map((p) => p.id)
  );
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<MultiRouteResult | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === savedPlaces.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedPlaces.map((p) => p.id));
    }
  };

  const handleOptimize = async () => {
    if (!currentLocation) {
      alert('출발지(현재 위치)를 먼저 측정해 주세요.');
      return;
    }
    const placesToOptimize = savedPlaces.filter((p) => selectedIds.includes(p.id));
    if (placesToOptimize.length === 0) {
      alert('최적 동선을 계산할 장소를 최소 1곳 이상 선택해 주세요.');
      return;
    }

    setIsCalculating(true);
    try {
      const res = await optimizeMultiStops(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        placesToOptimize
      );
      setRouteResult(res);
    } catch (err) {
      console.error('Route calculation failed', err);
      alert('경로 계산에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsCalculating(false);
    }
  };

  // 지도에 경로 적용 후 모달 닫기
  const handleApplyToMap = () => {
    if (!routeResult) return;
    const stopOrders: Record<string, number> = {};
    routeResult.orderedStops.forEach((stop) => {
      stopOrders[stop.place.id] = stop.order;
    });

    onApplyRouteToMap(routeResult.allCoordinates, stopOrders);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                최적 주행 거리 & 동선 최적화
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                  교통상황 반영
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                출발지부터 가장 덜 막히고 빠른 순서로 자동 계산합니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 my-3 space-y-4 pr-1">
          {/* 방문 장소 선택 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">
                방문할 장소 선택 ({selectedIds.length}/{savedPlaces.length})
              </span>
              <button
                onClick={selectAll}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {selectedIds.length === savedPlaces.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> 전체 해제
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" /> 전체 선택
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {savedPlaces.map((place) => {
                const isChecked = selectedIds.includes(place.id);
                return (
                  <div
                    key={place.id}
                    onClick={() => toggleSelect(place.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      isChecked
                        ? 'bg-blue-950/40 border-blue-500/60 text-white'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 border-slate-600 bg-slate-900">
                        {isChecked && (
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                        )}
                      </div>
                      <span className="font-semibold truncate">{place.customName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 truncate max-w-[120px]">
                      {place.originalAddress.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 계산 버튼 */}
          <button
            onClick={handleOptimize}
            disabled={isCalculating || selectedIds.length === 0}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? '실시간 최적 도로 경로 계산 중...' : '최적 방문 순서 & 주행거리 계산'}
          </button>

          {/* 계산 결과 표시 */}
          {routeResult && (
            <div className="space-y-3 animate-fade-in">
              {/* 총계 요약 카드 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/40 shadow-xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  동선 최적화 결과 요약
                </span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">총 도로 주행 거리</span>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      {formatDistance(routeResult.totalDistanceMeters)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">예상 총 소요 시간</span>
                    <p className="text-base font-extrabold text-cyan-300 mt-0.5 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(routeResult.totalDurationSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 최적 방문 순서 타임라인 */}
              <div>
                <p className="text-xs font-bold text-slate-300 mb-2">
                  추천 방문 순서 (가장 빠른 최적 경로):
                </p>
                <div className="space-y-2">
                  {/* 출발지 */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      출발
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-200">현재 측정 위치</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {currentLocation?.address || '현재 GPS 위치'}
                      </p>
                    </div>
                  </div>

                  {/* 경유지 목록 */}
                  {routeResult.orderedStops.map((stop) => (
                    <div
                      key={stop.place.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs hover:border-slate-600 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {stop.order}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate">
                            {stop.order}차: {stop.place.customName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {stop.place.originalAddress}
                          </p>
                        </div>
                      </div>

                      {/* 거리/시간 정보 & 개별 목적지 길안내 버튼 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-cyan-400 block">
                            +{formatDuration(stop.durationFromPrevSeconds)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDistance(stop.distanceFromPrevMeters)}
                          </span>
                        </div>
                        {/* 해당 순번 목적지로 바로 길안내 버튼 */}
                        <button
                          onClick={() => {
                            openKakaoMap({
                              name: `${stop.order}차: ${stop.place.customName}`,
                              latitude: stop.place.latitude,
                              longitude: stop.place.longitude,
                              address: stop.place.originalAddress,
                            });
                          }}
                          className="px-2 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition"
                          title={`${stop.order}차 목적지로 카카오맵 길안내 시작`}
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{stop.order}차 길안내</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 영역 */}
        {routeResult && (
          <div className="pt-3 border-t border-slate-800 space-y-2 shrink-0">
            {/* 경유지가 2개 이상일 때: 1차 경유 ➔ 2차 목적지 카카오맵 원터치 연동 */}
            {routeResult.orderedStops.length >= 2 && (
              <button
                onClick={() => {
                  const first = routeResult.orderedStops[0].place;
                  const second = routeResult.orderedStops[1].place;
                  openMultiStopNavigation(
                    {
                      name: `1차: ${first.customName}`,
                      latitude: first.latitude,
                      longitude: first.longitude,
                      address: first.originalAddress,
                    },
                    {
                      name: `2차: ${second.customName}`,
                      latitude: second.latitude,
                      longitude: second.longitude,
                      address: second.originalAddress,
                    }
                  );
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-md transition active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>[1차 경유 ➔ 2차 목적지] 카카오맵 한 번에 길안내</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleApplyToMap}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                지도에 전체 경로 표시
              </button>

              {/* 1차 목적지 바로 길안내 */}
              <button
                onClick={() => {
                  if (routeResult.orderedStops.length > 0) {
                    const first = routeResult.orderedStops[0].place;
                    openKakaoMap({
                      name: `1차: ${first.customName}`,
                      latitude: first.latitude,
                      longitude: first.longitude,
                      address: first.originalAddress,
                    });
                  }
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4 text-amber-400" />
                1차 목적지부터 출발
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
