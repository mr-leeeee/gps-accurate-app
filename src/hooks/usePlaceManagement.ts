import { useState, useCallback, useEffect } from 'react';
import type { LocationData, SavedPlace, ToastAction, TrashedPlace } from '../types/location';
import {
  getSavedPlaces,
  savePlace,
  updatePlace,
  deletePlace,
  clearAllPlaces,
  getTrash,
  restoreFromTrash,
  restoreAllFromTrash,
  deleteFromTrashPermanently,
  emptyTrash,
  importPlacesFromJSON,
  exportPlacesToJSON,
} from '../services/storageService';
import { exportBackup } from '../services/backupService';
import { copyLocationText, shareLocation, openRealdexWithAddress } from '../services/navigationService';
import { calculateDrivingRoute, formatDistance, formatDuration } from '../services/routeService';
import { logger } from '../utils/logger';
import { AppError } from '../types/errors';

interface UsePlaceManagementReturn {
  savedPlaces: SavedPlace[];
  trash: TrashedPlace[];
  selectedPlace: SavedPlace | null;
  editingPlace: SavedPlace | null;
  navigatingPlace: SavedPlace | null;
  routeCoordinates: [number, number][];
  stopOrders: Record<string, number>;
  isCopied: boolean;
  isRealdexCopied: boolean;
  setSelectedPlace: (place: SavedPlace | null) => void;
  setEditingPlace: (place: SavedPlace | null) => void;
  setNavigatingPlace: (place: SavedPlace | null) => void;
  setRouteCoordinates: (coords: [number, number][]) => void;
  setStopOrders: (orders: Record<string, number>) => void;
  handleSaveCurrentPlace: (currentLocation: LocationData) => void;
  handleSaveEditedPlace: (id: string, newName: string, newMemo?: string) => void;
  handleDeletePlace: (id: string) => void;
  handleClearAllPlaces: () => void;
  handleRestorePlace: (id: string) => void;
  handleRestoreAllFromTrash: () => void;
  handleDeleteFromTrashPermanently: (id: string) => void;
  handleEmptyTrash: () => void;
  handleImportBackup: (json: string) => boolean;
  handleExportBackup: () => Promise<void>;
  handleCopyCurrentLocation: (currentLocation: LocationData) => Promise<void>;
  handleOpenRealdex: (currentLocation: LocationData) => void;
  handleNavigatePlace: (place: SavedPlace) => void;
  handleSharePlace: (place: SavedPlace) => Promise<void>;
  handleAddCustomPlace: (place: SavedPlace) => void;
  handleRouteToPlace: (place: SavedPlace, currentLocation: LocationData) => Promise<void>;
  handleClearRoute: () => void;
  showToast: (msg: string, action?: ToastAction) => void;
}

interface UsePlaceManagementProps {
  showToast: (msg: string, action?: ToastAction) => void;
}

export function usePlaceManagement({ showToast }: UsePlaceManagementProps): UsePlaceManagementReturn {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [trash, setTrash] = useState<TrashedPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [navigatingPlace, setNavigatingPlace] = useState<SavedPlace | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [stopOrders, setStopOrders] = useState<Record<string, number>>({});
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isRealdexCopied, setIsRealdexCopied] = useState<boolean>(false);

  useEffect(() => {
    const places = getSavedPlaces();
    setSavedPlaces(places);
    setTrash(getTrash());
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

  const handleRestorePlace = useCallback(
    (id: string) => {
      setSavedPlaces(restoreFromTrash(id));
      setTrash(getTrash());
      showToast('장소를 목록으로 되돌렸습니다.');
    },
    [showToast]
  );

  const handleDeletePlace = useCallback(
    (id: string) => {
      const target = savedPlaces.find((place) => place.id === id);
      const name = target?.customName ?? '장소';

      setSavedPlaces(deletePlace(id));
      setTrash(getTrash());
      if (selectedPlace?.id === id) {
        setSelectedPlace(null);
      }

      showToast(`'${name}' 삭제됨. 휴지통에서 복원할 수 있습니다.`, {
        label: '되돌리기',
        onClick: () => handleRestorePlace(id),
      });
    },
    [savedPlaces, selectedPlace?.id, showToast, handleRestorePlace]
  );

  const handleClearAllPlaces = useCallback(() => {
    const count = savedPlaces.length;
    setSavedPlaces(clearAllPlaces());
    setTrash(getTrash());
    setSelectedPlace(null);

    if (count === 0) {
      showToast('저장된 장소가 없습니다.');
      return;
    }

    showToast(`${count}개 장소를 휴지통으로 옮겼습니다.`, {
      label: '전부 되돌리기',
      onClick: () => {
        setSavedPlaces(restoreAllFromTrash());
        setTrash(getTrash());
        showToast('모든 장소를 되돌렸습니다.');
      },
    });
  }, [savedPlaces.length, showToast]);

  const handleRestoreAllFromTrash = useCallback(() => {
    const count = trash.length;
    if (count === 0) return;
    setSavedPlaces(restoreAllFromTrash());
    setTrash(getTrash());
    showToast(`휴지통의 ${count}개 장소를 모두 되돌렸습니다.`);
  }, [trash.length, showToast]);

  const handleDeleteFromTrashPermanently = useCallback(
    (id: string) => {
      setTrash(deleteFromTrashPermanently(id));
      showToast('휴지통에서 영구 삭제했습니다.');
    },
    [showToast]
  );

  const handleEmptyTrash = useCallback(() => {
    setTrash(emptyTrash());
    showToast('휴지통을 모두 비웠습니다.');
  }, [showToast]);

  const handleImportBackup = useCallback(
    (json: string) => {
      try {
        const updated = importPlacesFromJSON(json);
        setSavedPlaces(updated);
        setTrash(getTrash());
        setSelectedPlace(null);
        showToast(`백업 파일에서 ${updated.length}개의 장소를 불러왔습니다.`);
        return true;
      } catch (err) {
        logger.error('Failed to import backup', err);
        showToast('백업 파일 형식이 올바르지 않습니다.');
        return false;
      }
    },
    [showToast]
  );

  const handleExportBackup = useCallback(async () => {
    const json = exportPlacesToJSON();
    try {
      const result = await exportBackup(json);
      const folder = result.folderName ? `${result.folderName} 폴더에 ` : '';
      showToast(
        result.shareCompleted
          ? `${folder}'${result.fileName}' 백업을 저장하고 공유했습니다.`
          : `${folder}'${result.fileName}'을 저장했습니다. 공유는 건너뛰었습니다.`
      );
    } catch (err) {
      if (err instanceof AppError) {
        showToast(err.userMessage);
        return;
      }
      logger.error('Failed to export backup', err);
      showToast('백업 파일을 만들지 못했습니다.');
    }
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

  const handleOpenRealdex = useCallback(
    async (currentLocation: LocationData) => {
      const copied = await openRealdexWithAddress({
        name: '현재 측정 위치',
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address,
      });
      if (copied) {
        setIsRealdexCopied(true);
        showToast('주소가 복사됐습니다. Realdex 지도에서 붙여넣으면 해당 단지로 이동합니다.');
        setTimeout(() => setIsRealdexCopied(false), 4000);
      }
    },
    [showToast]
  );

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
    trash,
    selectedPlace,
    editingPlace,
    navigatingPlace,
    routeCoordinates,
    stopOrders,
    isCopied,
    isRealdexCopied,
    setSelectedPlace,
    setEditingPlace,
    setNavigatingPlace,
    setRouteCoordinates,
    setStopOrders,
    handleSaveCurrentPlace,
    handleSaveEditedPlace,
    handleDeletePlace,
    handleClearAllPlaces,
    handleRestorePlace,
    handleRestoreAllFromTrash,
    handleDeleteFromTrashPermanently,
    handleEmptyTrash,
    handleImportBackup,
    handleExportBackup,
    handleCopyCurrentLocation,
    handleOpenRealdex,
    handleNavigatePlace,
    handleSharePlace,
    handleAddCustomPlace,
    handleRouteToPlace,
    handleClearRoute,
    showToast,
  };
}
