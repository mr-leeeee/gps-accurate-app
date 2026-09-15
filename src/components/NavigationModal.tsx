import React, { useState } from 'react';
import { X, Navigation, Share2, Copy, Check, ExternalLink, MapPin } from 'lucide-react';
import type { SavedPlace } from '../types/location';
import {
  openKakaoMap,
  openNaverMap,
  openTMap,
  openGoogleMap,
  shareLocation,
  copyLocationText,
} from '../services/navigationService';

interface NavigationModalProps {
  place: SavedPlace | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  place,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !place) return null;

  const target = {
    name: place.customName,
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.originalAddress,
  };

  const handleCopy = async () => {
    const ok = await copyLocationText(target);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await shareLocation(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 transform transition-all">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">길안내 및 위치 전달</h3>
              <p className="text-xs text-slate-400">네비게이션 앱으로 정확한 좌표를 전달합니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 선택된 장소 요약 */}
        <div className="my-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-100 truncate">{place.customName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{place.originalAddress}</p>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              위도 {place.latitude.toFixed(6)}, 경도 {place.longitude.toFixed(6)} (오차 ±{place.accuracy}m)
            </p>
          </div>
        </div>

        {/* 네비게이션 앱 버튼 목록 */}
        <div className="space-y-2 mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            설치된 네비게이션 앱 선택
          </p>

          {/* 카카오맵 */}
          <button
            onClick={() => openKakaoMap(target)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center font-black text-sm">
                K
              </div>
              <div className="text-left">
                <span className="text-sm block">카카오맵 길안내</span>
                <span className="text-[11px] font-normal text-black/60">KakaoMap 앱 바로 실행</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-black/60" />
          </button>

          {/* 네이버 지도 */}
          <button
            onClick={() => openNaverMap(target)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#03C75A] hover:bg-[#02b350] text-white font-bold shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-sm">
                N
              </div>
              <div className="text-left">
                <span className="text-sm block">네이버 지도 길안내</span>
                <span className="text-[11px] font-normal text-white/80">Naver Map 앱 바로 실행</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/80" />
          </button>

          {/* 티맵 (TMAP) */}
          <button
            onClick={() => openTMap(target)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-sm">
                T
              </div>
              <div className="text-left">
                <span className="text-sm block">티맵 (TMAP) 길안내</span>
                <span className="text-[11px] font-normal text-white/80">TMAP 내비게이션 바로 실행</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/80" />
          </button>

          {/* 구글 지도 */}
          <button
            onClick={() => openGoogleMap(target)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold border border-slate-700 shadow-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                G
              </div>
              <div className="text-left">
                <span className="text-sm block">구글 지도 (Google Maps)</span>
                <span className="text-[11px] font-normal text-slate-400">구글맵 경로 안내</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* 타 어플 및 메신저 전달 (공유 / 복사) */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md transition"
          >
            <Share2 className="w-4 h-4" />
            카톡/메신저 공유
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                복사 완료!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                좌표 텍스트 복사
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
