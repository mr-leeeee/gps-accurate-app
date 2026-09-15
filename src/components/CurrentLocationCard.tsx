import { Crosshair, Save, Copy, Check, Compass, ShieldAlert, Sparkles } from 'lucide-react';
import type { LocationData } from '../types/location';
import { getAccuracyInfo } from '../services/locationService';

interface CurrentLocationCardProps {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  onRefreshLocation: () => void;
  onSaveLocation: () => void;
  onCopyLocation: () => void;
  isCopied: boolean;
}

export const CurrentLocationCard: React.FC<CurrentLocationCardProps> = ({
  location,
  isLoading,
  error,
  onRefreshLocation,
  onSaveLocation,
  onCopyLocation,
  isCopied,
}) => {
  const accuracyInfo = location ? getAccuracyInfo(location.accuracy) : null;

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-700/70">
      {/* 헤더 & 새로고침 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
            <Compass className="w-5 h-5 animate-spin-slow" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              정밀 GPS 위치 측정
              {location && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-label="측정 완료"></span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {location
                ? `측정 시각: ${new Date(location.timestamp).toLocaleTimeString()}`
                : '버튼을 눌러 현재 위치를 측정하세요'}
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshLocation}
          disabled={isLoading}
          aria-label={isLoading ? '위치 측정 중' : '현재 위치 측정'}
          className="relative inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          <Crosshair className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isLoading ? '측정 중...' : '위치 측정'}
        </button>
      </div>

      {/* 에러 발생 시 안내 */}
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2" role="alert">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{error}</p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">
              브라우저 위치 권한 허용 여부 또는 GPS 활성화 상태를 확인해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* 측정된 위치 정보 상세 */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700/50">
            <div className="h-3 bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
              <div className="h-3 bg-slate-700 rounded w-16 mb-1"></div>
              <div className="h-4 bg-slate-700 rounded w-20"></div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
              <div className="h-3 bg-slate-700 rounded w-16 mb-1"></div>
              <div className="h-4 bg-slate-700 rounded w-20"></div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40 col-span-2">
              <div className="h-3 bg-slate-700 rounded w-24 mb-1"></div>
              <div className="h-4 bg-slate-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      ) : location ? (
        <div className="space-y-3">
          {/* 주소 및 복사 영역 */}
          <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                  현재 도로명/지번 주소
                </span>
                <p className="text-sm font-semibold text-slate-100 break-words mt-0.5">
                  {location.address || '주소 정보를 확인 중입니다...'}
                </p>
              </div>
              <button
                onClick={onCopyLocation}
                aria-label={isCopied ? '복사 완료' : '좌표 및 주소 복사'}
                className="shrink-0 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* 위도, 경도, 오차범위, 고도 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            {/* 위도/경도 */}
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 font-medium">위도 (Latitude)</span>
              <p className="text-sm font-mono font-bold text-slate-100">
                {location.latitude.toFixed(6)}°
              </p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 font-medium">경도 (Longitude)</span>
              <p className="text-sm font-mono font-bold text-slate-100">
                {location.longitude.toFixed(6)}°
              </p>
            </div>

            {/* 정확도 오차범위 뱃지 */}
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-medium">측정 정밀도 (오차 범위)</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${accuracyInfo?.badgeClass}`}
                  >
                    {accuracyInfo?.text}
                  </span>
                  {location.altitude !== null && (
                    <span className="text-xs text-slate-400">
                      고도: 해발 {location.altitude}m
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={onSaveLocation}
                aria-label="현재 위치를 장소 목록에 저장"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                장소 목록에 저장
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 위치를 아직 측정하지 않았을 때의 안내 카드 */
        <div className="text-center py-6 px-4 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/70">
          <Sparkles className="w-8 h-8 text-blue-400/70 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-200">
            상단의 [위치 측정] 버튼을 눌러주세요
          </p>
          <p className="text-xs text-slate-400 mt-1">
            스마트폰의 고정밀 GPS 센서로 현재 위치와 오차 범위를 측정합니다.
          </p>
        </div>
      )}
    </div>
  );
};
