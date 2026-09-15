import { useState, useCallback, useEffect } from 'react';
import type { LocationData, SavedPlace } from '../types/location';
import {
  getSavedPlaces,
  savePlace,
  updatePlace,
  deletePlace,
  clearAllPlaces,
} from '../services/storageService';
import { copyLocationText, shareLocation } from '../services/navigationService';
import { calculateDrivingRoute, formatDistance, formatDuration } from '../services/routeService';
import { logger } from '../utils/logger';

interface UsePlaceManagementReturn {
  savedPlaces: SavedPlace[];
  selectedPlace: SavedPlace | null;
  editingPlace: SavedPlace | null;
  navigatingPlace: SavedPlace | null;
  routeCoordinates: [number, number][];
  stopOrders: Record<string, number>;
  isCopied: boolean;
  setSelectedPlace: (place: SavedPlace | null) => void;
  setEditingPlace: (place: SavedPlace | null) => void;
  setNavigatingPlace: (place: SavedPlace | null) => void;
  setRouteCoordinates: (coords: [number, number][]) => void;
  setStopOrders: (orders: Record<string, number>) => void;
  handleSaveCurrentPlace: (currentLocation: LocationData) => void;
  handleSaveEditedPlace: (id: string, newName: string, newMemo?: string) => void;
  handleDeletePlace: (id: string) => void;
  handleClearAllPlaces: () => void;
  handleCopyCurrentLocation: (currentLocation: LocationData) => Promise<void>;
  handleNavigatePlace: (place: SavedPlace) => void;
  handleSharePlace: (place: SavedPlace) => Promise<void>;
  handleAddCustomPlace: (place: SavedPlace) => void;
  handleRouteToPlace: (place: SavedPlace, currentLocation: LocationData) => Promise<void>;
  handleClearRoute: () => void;
  showToast: (msg: string) => void;
}

interface UsePlaceManagementProps {
  showToast: (msg: string) => void;
}

export function usePlaceManagement({ showToast }: UsePlaceManagementProps): UsePlaceManagementReturn {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [navigatingPlace, setNavigatingPlace] = useState<SavedPlace | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [stopOrders, setStopOrders] = useState<Record<string, number>>({});
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    const places = getSavedPlaces();
    setSavedPlaces(places);
  }, []);

  const handleSaveCurrentPlace = useCallback((currentLocation: LocationData) => {
    if (!currentLocation) {
      alert('먼저 상단의 [위치 측정] 버튼을 눌러 위치를 확인해주세요.');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const count = savedPlaces.length + 1;

    const defaultName = `장소 ${count} (${timeStr})`;

    const newPlace: SavedPlace = {
      id: 'place_' + Date.now(),
      customName: defaultName,
      originalAddress: currentLocation.address || '측정 주소',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      altitude: currentLocation.altitude,
      timestamp: Date.now(),
      memo: '',
    };

    const updated = savePlace(newPlace);
    setSavedPlaces(updated);
    setSelectedPlace(newPlace);

    if ('vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
    showToast(`'${defaultName}'이(가) 목록에 저장되었습니다.`);

    setEditingPlace(newPlace);
  }, [savedPlaces.length, showToast]);

  const handleSaveEditedPlace = useCallback((id: string, newName: string, newMemo?: string) => {
    const updated = updatePlace(id, newName, newMemo);
    setSavedPlaces(updated);
    showToast('장소 정보가 성공적으로 변경되었습니다.');
  }, [showToast]);

  const handleDeletePlace = useCallback((id: string) => {
    const updated = deletePlace(id);
    setSavedPlaces(updated);
    if (selectedPlace?.id === id) {
      setSelectedPlace(null);
    }
    showToast('장소가 목록에서 삭제되었습니다.');
  }, [selectedPlace?.id, showToast]);

  const handleClearAllPlaces = useCallback(() => {
    const updated = clearAllPlaces();
    setSavedPlaces(updated);
    setSelectedPlace(null);
    showToast('모든 장소 목록이 삭제되었습니다.');
  }, [showToast]);

  const handleCopyCurrentLocation = useCallback(async (currentLocation: LocationData) => {
    if (!currentLocation) return;
    const ok = await copyLocationText({
      name: '현재 측정 위치',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: currentLocation.address,
    });
    if (ok) {
      setIsCopied(true);
      showToast('좌표와 주소가 클립보드에 복사되었습니다.');
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [showToast]);

  const handleNavigatePlace = useCallback((place: SavedPlace) => {
    setNavigatingPlace(place);
  }, []);

  const handleSharePlace = useCallback(async (place: SavedPlace) => {
    await shareLocation({
      name: place.customName,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.originalAddress,
    });
  }, []);

  const handleAddCustomPlace = useCallback((place: SavedPlace) => {
    const updated = savePlace(place);
    setSavedPlaces(updated);
    setSelectedPlace(place);
    showToast(`'${place.customName}' 주소가 확인되어 목록에 저장되었습니다.`);
  }, [showToast]);

  const handleRouteToPlace = useCallback(async (place: SavedPlace, currentLocation: LocationData) => {
    if (!currentLocation) {
      alert('출발지(현재 위치)를 먼저 측정해 주세요.');
      return;
    }

    try {
      showToast(`'${place.customName}'까지 도로 경로 계산 중...`);
      const route = await calculateDrivingRoute(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        {
          latitude: place.latitude,
          longitude: place.longitude,
        }
      );

      setRouteCoordinates(route.coordinates);
      setStopOrders({ [place.id]: 1 });
      setSelectedPlace(place);

      showToast(
        `🚗 거리 ${formatDistance(route.distanceMeters)} / 예상 ${formatDuration(route.durationSeconds)} 소요`
      );
    } catch (err) {
      logger.error('Failed to calculate route', err);
      showToast('경로 계산에 실패했습니다.');
    }
  }, [showToast]);

  const handleClearRoute = useCallback(() => {
    setRouteCoordinates([]);
    setStopOrders({});
    showToast('지도에서 경로가 해제되었습니다.');
  }, [showToast]);

  return {
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
    showToast,
  };
}
