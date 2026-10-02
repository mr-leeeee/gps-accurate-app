import { useState, useCallback, useRef, useEffect } from 'react';
import type { LocationData, ToastAction } from '../types/location';
import { GeolocationError } from '../types/errors';
import { fetchCurrentPosition } from '../services/locationService';
import { logger } from '../utils/logger';
import { DEFAULT_LOCATION, GHOST_MODE, TOAST_DURATION, UNDO_TOAST_DURATION } from '../constants';

interface UseLocationManagementReturn {
  currentLocation: LocationData | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  handleMeasureLocation: () => Promise<void>;
  handleSetMockLocation: (mock: LocationData) => void;
  showToast: (msg: string, action?: ToastAction) => void;
  dismissToast: () => void;
  toastMessage: string | null;
  toastAction: ToastAction | null;
  isLiveTracking: boolean;
  toggleLiveTracking: () => void;
}

export function useLocationManagement(): UseLocationManagementReturn {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, action?: ToastAction) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    setToastAction(action ?? null);
    toastTimeoutRef.current = setTimeout(
      () => {
        setToastMessage(null);
        setToastAction(null);
        toastTimeoutRef.current = null;
      },
      action ? UNDO_TOAST_DURATION : TOAST_DURATION
    );
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
    setToastAction(null);
  }, []);

  const handleMeasureLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const loc = await fetchCurrentPosition();
      setCurrentLocation(loc);

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      showToast('📍 고정밀 위치 측정이 완료되었습니다.');
    } catch (err) {
      logger.warn('GPS measurement warning', err);
      let message = '위치를 가져오지 못했습니다.';
      
      if (err instanceof GeolocationError) {
        message = err.userMessage;
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      setLocationError(message);

      setCurrentLocation((prev) => (GHOST_MODE && !prev ? DEFAULT_LOCATION : prev));
    } finally {
      setIsLoadingLocation(false);
    }
  }, [showToast]);

  const handleSetMockLocation = useCallback((mock: LocationData) => {
    setCurrentLocation(mock);
  }, []);

  // 실시간 추적 토글 함수
  const toggleLiveTracking = useCallback(() => {
    setIsLiveTracking((prev) => !prev);
  }, []);

  // 실시간 추적 시작/중지 효과
  useEffect(() => {
    if (!isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        logger.info('Live tracking stopped');
      }
      return;
    }

    if (!navigator.geolocation) {
      showToast('브라우저가 위치 정보를 지원하지 않습니다.');
      setIsLiveTracking(false);
      return;
    }

    logger.info('Live tracking started');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          isMock: false,
        };
        setCurrentLocation(newLocation);
      },
      (error) => {
        logger.warn('Live tracking error', error);
        let message = '실시간 위치 추적에 실패했습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          message = '위치 권한이 필요합니다.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = '위치 정보를 사용할 수 없습니다.';
        } else if (error.code === error.TIMEOUT) {
          message = '위치 요청 시간이 초과되었습니다.';
        }
        showToast(message);
        setIsLiveTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLiveTracking, showToast]);

  return {
    currentLocation,
    isLoadingLocation,
    locationError,
    handleMeasureLocation,
    handleSetMockLocation,
    showToast,
    dismissToast,
    toastMessage,
    toastAction,
    isLiveTracking,
    toggleLiveTracking,
  };
}
