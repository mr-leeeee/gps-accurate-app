import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { LocationData, SavedPlace } from '../types/location';
import { X, Map, Satellite, Maximize2, Minimize2, Crosshair } from 'lucide-react';

interface MapViewerProps {
  currentLocation: LocationData | null;
  savedPlaces: SavedPlace[];
  selectedPlace: SavedPlace | null;
  routeCoordinates?: [number, number][];
  stopOrders?: Record<string, number>;
  isLiveTracking?: boolean;
  onToggleLiveTracking?: () => void;
  onSelectPlace?: (place: SavedPlace) => void;
  onClearRoute?: () => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  currentLocation,
  savedPlaces,
  selectedPlace,
  routeCoordinates,
  stopOrders = {},
  isLiveTracking = false,
  onToggleLiveTracking,
  onSelectPlace,
  onClearRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const placesLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const osmLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // 전체화면 토글 함수
  const toggleFullscreen = useCallback(() => {
    if (!mapWrapperRef.current) return;

    if (!isFullscreen) {
      // 전체화면 진입
      if (mapWrapperRef.current.requestFullscreen) {
        mapWrapperRef.current.requestFullscreen();
      } else if ((mapWrapperRef.current as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen) {
        (mapWrapperRef.current as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else {
      // 전체화면 해제
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // 전체화면 변경 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // 전체화면 전환 후 지도 리사이즈
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 1. 지도 인스턴스 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // 기본 위치: 서울시청
    const initialLat = currentLocation ? currentLocation.latitude : 37.566535;
    const initialLng = currentLocation ? currentLocation.longitude : 126.977969;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
    });

    // 기본 지도 레이어 (CartoDB Voyager)
    osmLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // 위성 레이어 (ESRI World Imagery - 무료, API 키 불필요)
    satelliteLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
        maxZoom: 22,
      }
    );

    // 줌 컨트롤 우측 하단 배치
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    placesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // 모바일 리사이즈 시 지도 깨짐 방지
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 레이어 전환 함수
  const toggleLayer = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isSatellite) {
      // 위성 → 지도 전환
      if (satelliteLayerRef.current) {
        map.removeLayer(satelliteLayerRef.current);
      }
      if (osmLayerRef.current) {
        osmLayerRef.current.addTo(map);
      }
    } else {
      // 지도 → 위성 전환
      if (osmLayerRef.current) {
        map.removeLayer(osmLayerRef.current);
      }
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.addTo(map);
      }
    }

    setIsSatellite(!isSatellite);
  };

  // 2. 현재 위치 및 오차 반경 원 업데이트
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentLocation) return;

    const { latitude, longitude, accuracy } = currentLocation;
    const latLng: L.LatLngExpression = [latitude, longitude];

    if (currentMarkerRef.current) {
      map.removeLayer(currentMarkerRef.current);
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
    }

    // 커스텀 펄스 블루 마커
    const pulseIcon = L.divIcon({
      className: 'custom-gps-icon',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 100%; height: 100%; background: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: relative; width: 14px; height: 14px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    currentMarkerRef.current = L.marker(latLng, { icon: pulseIcon }).addTo(map);
    currentMarkerRef.current.bindPopup(`
      <div style="font-size: 13px; font-weight: bold; color: #1e293b;">
        📍 현재 측정 위치<br>
        <span style="font-size: 11px; font-weight: normal; color: #64748b;">
          오차 범위: ±${accuracy.toFixed(1)}m
        </span>
      </div>
    `);

    // 오차 반경 원 표시
    accuracyCircleRef.current = L.circle(latLng, {
      radius: Math.max(accuracy, 5),
      color: '#3b82f6',
      fillColor: '#60a5fa',
      fillOpacity: 0.15,
      weight: 1.5,
    }).addTo(map);

    // 경로 표시 중이 아닐 때만 현재 위치로 이동
    if (!selectedPlace && (!routeCoordinates || routeCoordinates.length === 0)) {
      map.flyTo(latLng, 16, { animate: true, duration: 1 });
    }
  }, [currentLocation]);

  // 3. 저장된 장소들 마커 렌더링 (순번 stopOrders 지원)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const placesLayer = placesLayerRef.current;
    if (!map || !placesLayer) return;

    placesLayer.clearLayers();

    savedPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const order = stopOrders[place.id];
      const hasOrder = typeof order === 'number';

      // 순번이 있으면 녹색/인디고, 선택은 빨강, 기본은 골드
      let markerColor = '#f59e0b';
      if (hasOrder) {
        markerColor = '#10b981';
      } else if (isSelected) {
        markerColor = '#ef4444';
      }

      const label = hasOrder
        ? `[${order}] ${place.customName.slice(0, 8)}`
        : `${place.customName.slice(0, 10)}${place.customName.length > 10 ? '...' : ''}`;

      const placeIcon = L.divIcon({
        className: 'custom-place-icon',
        html: `
          <div style="cursor: pointer; transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
            <div style="background: ${markerColor}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 1.5px solid white;">
              ${label}
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${markerColor};"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: placeIcon });
      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });
      placesLayer.addLayer(marker);
    });
  }, [savedPlaces, selectedPlace, stopOrders, onSelectPlace]);

  // 4. 도로 주행 경로선(Polyline) 렌더링
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // 경로 전체가 한눈에 보이도록 지도 뷰포트 자동 조절
      map.fitBounds(polyline.getBounds(), {
        padding: [35, 35],
        maxZoom: 16,
        animate: true,
      });
    }
  }, [routeCoordinates]);

  // 5. 특정 장소 선택 시 지도 이동
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace || (routeCoordinates && routeCoordinates.length > 0)) return;

    map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 17, {
      animate: true,
      duration: 0.8,
    });
  }, [selectedPlace]);

  return (
    <div
      ref={mapWrapperRef}
      className={`relative w-full bg-slate-900 ${
        isFullscreen
          ? 'h-screen rounded-none'
          : 'h-64 sm:h-72 rounded-2xl'
      } overflow-hidden shadow-lg border ${isFullscreen ? 'border-transparent' : 'border-slate-700/60'}`}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 경로 활성화 중일 때 안내 뱃지 및 경로 해제 버튼 */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <div className="absolute top-3 left-3 z-[400] bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-blue-400/50 flex items-center gap-2">
          <span>🚗 최적 도로 경로 안내 중</span>
          {onClearRoute && (
            <button
              onClick={onClearRoute}
              className="p-0.5 rounded-full hover:bg-black/20"
              title="경로선 지우기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 전체화면 토글 버튼 (우측 상단) */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white w-10 h-10 rounded-full shadow-md border border-slate-700 hover:bg-slate-800 transition flex items-center justify-center"
        title={isFullscreen ? '전체화면 해제' : '전체화면'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </button>

      {/* 현재 위치 버튼 (전체화면 버튼 아래) */}
      {currentLocation && (
        <button
          onClick={() => {
            if (mapInstanceRef.current && currentLocation) {
              mapInstanceRef.current.flyTo(
                [currentLocation.latitude, currentLocation.longitude],
                17,
                { animate: true }
              );
            }
          }}
          className="absolute top-16 right-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border border-slate-700 hover:bg-slate-800 transition flex items-center gap-1.5"
          title="현재 위치로 지도 중심 맞추기"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          내 위치
        </button>
      )}

      {/* 레이어 스위치 버튼 (전체화면 버튼 아래, 현재 위치 버튼 아래) */}
      <button
        onClick={toggleLayer}
        className="absolute top-28 right-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white w-10 h-10 rounded-full shadow-md border border-slate-700 hover:bg-slate-800 transition flex items-center justify-center"
        title={isSatellite ? '지도 뷰로 전환' : '위성 뷰로 전환'}
      >
        {isSatellite ? (
          <Map className="w-5 h-5" />
        ) : (
          <Satellite className="w-5 h-5" />
        )}
      </button>

      {/* 실시간 추적 버튼 (레이어 스위치 아래) */}
      {onToggleLiveTracking && (
        <button
          onClick={onToggleLiveTracking}
          className={`absolute top-40 right-3 z-[400] w-10 h-10 rounded-full shadow-md border transition flex items-center justify-center ${
            isLiveTracking
              ? 'bg-green-500/90 backdrop-blur-md text-white border-green-400 animate-pulse'
              : 'bg-slate-900/90 backdrop-blur-md text-white border-slate-700 hover:bg-slate-800'
          }`}
          title={isLiveTracking ? '실시간 추적 중지' : '실시간 추적 시작'}
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
