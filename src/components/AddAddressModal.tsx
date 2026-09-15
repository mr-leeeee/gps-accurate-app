import React, { useState } from 'react';
import {
  X,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Building,
} from 'lucide-react';
import type { SavedPlace } from '../types/location';
import { searchAndValidateAddress } from '../services/locationService';
import type { AddressSearchResult } from '../services/locationService';

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlace: (place: SavedPlace) => void;
}

const EXAMPLE_ADDRESSES = [
  '세종대로 110',
  '강남대로 390',
  '판교역로 235',
  '해운대해변로 264',
  '인천공항 제1여객터미널',
];

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  onAddPlace,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AddressSearchResult | null>(
    null
  );

  const [customName, setCustomName] = useState('');
  const [memo, setMemo] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (targetQuery?: string) => {
    const text = (targetQuery || query).trim();
    if (!text) return;

    setIsSearching(true);
    setHasSearched(true);
    setSelectedResult(null);

    try {
      const list = await searchAndValidateAddress(text);
      setResults(list);
      if (list.length > 0) {
        // 첫 번째 결과를 기본 선택
        selectAddress(list[0]);
      }
    } catch (err) {
      console.error('Search failed', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (addr: AddressSearchResult) => {
    setSelectedResult(addr);
    setCustomName(addr.displayName || addr.formattedAddress);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) return;

    const newPlace: SavedPlace = {
      id: 'custom_' + Date.now(),
      customName: customName.trim() || selectedResult.displayName,
      originalAddress: selectedResult.formattedAddress,
      latitude: selectedResult.latitude,
      longitude: selectedResult.longitude,
      accuracy: 1.0, // 공식 주소 지오코딩으로 정밀
      altitude: null,
      timestamp: Date.now(),
      memo: memo.trim(),
    };

    onAddPlace(newPlace);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                주소 직접 입력 및 실제 주소 확인
              </h3>
              <p className="text-xs text-slate-400">
                도로명 또는 지번 주소를 입력하면 실제 유효성을 확인합니다
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
          {/* 주소 검색창 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              도로명 주소 / 지번 주소 / 건물명
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="예: 세종대로110, 테헤란로152, 판교역로"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-md transition disabled:opacity-50 shrink-0"
              >
                {isSearching ? '확인 중...' : '주소 확인'}
              </button>
            </form>

            {/* 빠른 추천 예시 주소 */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">예시:</span>
              {EXAMPLE_ADDRESSES.map((ex) => (
                <button
                  type="button"
                  key={ex}
                  onClick={() => {
                    setQuery(ex);
                    handleSearch(ex);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* 주소 검증 결과 피드백 */}
          {hasSearched && (
            <div>
              {results.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>실제 존재하는 공식 주소가 확인되었습니다 ({results.length}건)</span>
                  </div>

                  {/* 후보 목록 */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {results.map((item, idx) => {
                      const isSelected =
                        selectedResult?.formattedAddress === item.formattedAddress;
                      return (
                        <div
                          key={idx}
                          onClick={() => selectAddress(item)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2 ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm'
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <MapPin
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isSelected ? 'text-purple-400' : 'text-slate-500'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{item.displayName}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 break-words">
                              {item.formattedAddress}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 mt-1">
                              좌표: ({item.latitude.toFixed(5)}, {item.longitude.toFixed(5)})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">일치하는 실제 주소를 찾을 수 없습니다.</p>
                    <p className="text-[11px] text-rose-400/80 mt-0.5">
                      도로명 명칭이나 번지수 오타를 확인해 주시거나, 시/군/구 명칭을 함께 입력해 보세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 선택된 주소가 있을 때 추가 정보(별칭, 메모) 입력 */}
          {selectedResult && (
            <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  장소 이름 (별칭)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="예: 우리 거래처, 단골 식당, 부모님 댁"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  추가 메모 (선택)
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 3층 회의실, 주차장 입구는 건물 뒤편"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 저장 버튼 */}
        {selectedResult && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              검증된 장소 저장하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
