import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Smartphone,
  Maximize2,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { validateEnv } from './utils/env';
import { useLocationManagement } from './hooks/useLocationManagement';
import { usePlaceManagement } from './hooks/usePlaceManagement';
import { MapViewer } from './components/MapViewer';
import { CurrentLocationCard } from './components/CurrentLocationCard';
import { PlaceList } from './components/PlaceList';
import { EditModal } from './components/EditModal';
import { NavigationModal } from './components/NavigationModal';
import { RouteOptimizeModal } from './components/RouteOptimizeModal';
import { AddAddressModal } from './components/AddAddressModal';
import { TestLocationPanel } from './components/TestLocationPanel';
import { InformationModal } from './components/InformationModal';

export const App: React.FC = () => {
  validateEnv();

  const {
    currentLocation,
    isLoadingLocation,
    locationError,
    handleMeasureLocation,
    handleSetMockLocation,
    showToast,
    toastMessage,
    isLiveTracking,
    toggleLiveTracking,
  } = useLocationManagement();

  // 장소 관리 훅
  const {
    savedPlaces,
    selectedPlace,
    editingPlace,
    navigatingPlace,
    routeCoordinates,
    stopOrders,
    isCopied,
    setSelectedPlace,
    setEditingPlace,
    setNavigatingPlace,
    setRouteCoordinates,
    setStopOrders,
    handleSaveCurrentPlace,
    handleSaveEditedPlace,
    handleDeletePlace,
    handleClearAllPlaces,
    handleCopyCurrentLocation,
    handleNavigatePlace,
    handleSharePlace,
    handleAddCustomPlace,
    handleRouteToPlace,
    handleClearRoute,
  } = usePlaceManagement({ showToast });

  // 모달 상태
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // 초기 위치 측정
  useEffect(() => {
    handleMeasureLocation();
  }, [handleMeasureLocation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:py-6 sm:px-4 font-sans">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-slate-900/95 border border-blue-500/50 text-blue-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* 스마트폰 앱 컨테이너 */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[440px] sm:border sm:border-slate-800 sm:rounded-[36px] sm:shadow-2xl sm:shadow-black/80 sm:overflow-hidden bg-slate-900 flex flex-col'
            : 'max-w-4xl rounded-2xl bg-slate-900 p-4'
        }`}
      >
        {/* 상단 앱 바 */}
        <header className="px-4 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                정밀 GPS 위치 알림이
              </h1>
              <p className="text-[10px] text-slate-400">네비게이션 연동 및 장소 관리</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
              title="앱 정보"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGuideModal(true)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
              title="앱 사용 가이드"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="hidden sm:flex p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
              title={isMobileFrame ? '와이드 뷰로 전환' : '스마트폰 뷰로 전환'}
            >
              {isMobileFrame ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* 본문 콘텐츠 영역 */}
        <main className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
          {/* 지도 뷰어 */}
          <MapViewer
            currentLocation={currentLocation}
            savedPlaces={savedPlaces}
            selectedPlace={selectedPlace}
            routeCoordinates={routeCoordinates}
            stopOrders={stopOrders}
            isLiveTracking={isLiveTracking}
            onToggleLiveTracking={toggleLiveTracking}
            onSelectPlace={(place) => {
              setSelectedPlace(place);
              showToast(`지도에서 [${place.customName}]을 선택했습니다.`);
            }}
            onClearRoute={handleClearRoute}
          />

          {/* 현재 위치 측정 & 저장 카드 */}
          <CurrentLocationCard
            location={currentLocation}
            isLoading={isLoadingLocation}
            error={locationError}
            onRefreshLocation={handleMeasureLocation}
            onSaveLocation={() => currentLocation && handleSaveCurrentPlace(currentLocation)}
            onCopyLocation={() => currentLocation && handleCopyCurrentLocation(currentLocation)}
            isCopied={isCopied}
          />

          {/* 테스트용 모의 위치 버튼 */}
          <TestLocationPanel onSetMockLocation={handleSetMockLocation} />

          {/* 저장된 장소 목록 & CRUD */}
          <PlaceList
            places={savedPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={(place) => setSelectedPlace(place)}
            onNavigatePlace={handleNavigatePlace}
            onEditPlace={(place) => setEditingPlace(place)}
            onDeletePlace={handleDeletePlace}
            onClearAllPlaces={handleClearAllPlaces}
            onSharePlace={handleSharePlace}
            onRouteToPlace={(place) => currentLocation && handleRouteToPlace(place, currentLocation)}
            onOpenRouteOptimizer={() => setIsRouteModalOpen(true)}
            onOpenAddAddressModal={() => setIsAddAddressModalOpen(true)}
          />
        </main>

        {/* 하단 푸터 */}
        <footer className="py-2.5 px-4 bg-slate-900/90 border-t border-slate-800 text-center text-[11px] text-slate-500">
          고정밀 GPS 센서 & 카카오맵·네이버지도·티맵 딥링크 지원
        </footer>
      </div>

      {/* 모달 1: 장소 이름 변경 및 메모 수정 모달 */}
      <EditModal
        place={editingPlace}
        isOpen={!!editingPlace}
        onClose={() => setEditingPlace(null)}
        onSave={handleSaveEditedPlace}
      />

      {/* 모달 2: 네비게이션 앱 연동 및 위치 전달 모달 */}
      <NavigationModal
        place={navigatingPlace}
        isOpen={!!navigatingPlace}
        onClose={() => setNavigatingPlace(null)}
      />

      {/* 모달 3: 최적 동선 및 도로 주행거리 계산 모달 */}
      <RouteOptimizeModal
        currentLocation={currentLocation}
        savedPlaces={savedPlaces}
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        onApplyRouteToMap={(coords, orders) => {
          setRouteCoordinates(coords);
          setStopOrders(orders);
          showToast('지도에 최적 동선 주행 경로가 표시되었습니다.');
        }}
      />

      {/* 모달 4: 주소 직접 입력 및 실제 주소 검증 모달 */}
      <AddAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        onAddPlace={handleAddCustomPlace}
      />

      {/* 사용 방법 가이드 모달 */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" />
                스마트폰 GPS 어플 사용 안내
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="font-bold text-blue-400">1. 현재 위치 측정</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  상단 [위치 측정] 버튼을 누르면 스마트폰 GPS를 통해 오차 범위(±m)와 주소를 정밀 측정합니다.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="font-bold text-emerald-400">2. 장소 목록 기록 및 이름 변경/삭제</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  [장소 목록에 저장] 버튼을 누르면 목록에 즉시 추가되며, 원하는 이름(예: 주차 위치, 약속 장소)으로 자유롭게 변경 및 삭제할 수 있습니다.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                <p className="font-bold text-indigo-400">3. 네비게이션 & 타 어플 전달</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  [길안내/네비]를 누르면 카카오맵, 네이버 지도, 티맵, 구글맵으로 정확한 좌표가 전달되어 즉시 길안내가 시작됩니다. [공유]로 카톡 전달도 가능합니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}

      {/* 정보 모달 */}
      <InformationModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </div>
  );
};

export default App;
