import { logger } from '../utils/logger';

export type NavigationProvider = 'kakao' | 'naver' | 'tmap' | 'google';

interface NavigationTarget {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * 모바일 브라우저 및 스마트폰에서 딥링크(앱 스킴) 실행 시도 후 웹 폴백 연결
 */
function openWithFallback(appScheme: string, webFallback: string) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // 딥링크 실행 시도
    const startTime = Date.now();
    window.location.href = appScheme;

    // 앱이 미설치되어 안 열릴 경우 1.2초 후 웹 폴백 페이지로 전환
    setTimeout(() => {
      if (Date.now() - startTime < 1600) {
        window.open(webFallback, '_blank');
      }
    }, 1200);
  } else {
    // PC 웹 환경에서는 바로 새 탭으로 웹 길안내 열기
    window.open(webFallback, '_blank');
  }
}

/**
 * 카카오맵 길안내 실행
 */
export function openKakaoMap(target: NavigationTarget) {
  const encName = encodeURIComponent(target.name);
  const appScheme = `kakaomap://route?ep=${target.latitude},${target.longitude}&by=CAR`;
  const webUrl = `https://map.kakao.com/link/to/${encName},${target.latitude},${target.longitude}`;
  openWithFallback(appScheme, webUrl);
}

/**
 * 네이버 지도 길안내 실행
 */
export function openNaverMap(target: NavigationTarget) {
  const encName = encodeURIComponent(target.name);
  const appScheme = `nmap://route/car?dlat=${target.latitude}&dlng=${target.longitude}&dname=${encName}&appname=gps.smartapp`;
  const webUrl = `https://map.naver.com/v5/directions/-/-/${target.latitude},${target.longitude},${encName}/car`;
  openWithFallback(appScheme, webUrl);
}

/**
 * 티맵(TMAP) 길안내 실행
 */
export function openTMap(target: NavigationTarget) {
  const encName = encodeURIComponent(target.name);
  const appScheme = `tmap://route?rGoName=${encName}&rGoX=${target.longitude}&rGoY=${target.latitude}`;
  const webUrl = `https://tmap.co.kr`;
  openWithFallback(appScheme, webUrl);
}

/**
 * 1차 경유지 + 2차(최종) 목적지 다중 길안내 실행 (카카오맵 연동)
 */
export function openMultiStopNavigation(
  via: NavigationTarget,
  destination: NavigationTarget
) {
  const appScheme = `kakaomap://route?via=${via.latitude},${via.longitude}&ep=${destination.latitude},${destination.longitude}&by=CAR`;
  const encDest = encodeURIComponent(destination.name);
  const webUrl = `https://map.kakao.com/link/to/${encDest},${destination.latitude},${destination.longitude}`;
  openWithFallback(appScheme, webUrl);
}

/**
 * 구글 지도 길안내 실행
 */
export function openGoogleMap(target: NavigationTarget) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;
  window.open(url, '_blank');
}

/**
 * 공급자에 따라 길안내 실행
 */
export function navigateTo(provider: NavigationProvider, target: NavigationTarget) {
  switch (provider) {
    case 'kakao':
      openKakaoMap(target);
      break;
    case 'naver':
      openNaverMap(target);
      break;
    case 'tmap':
      openTMap(target);
      break;
    case 'google':
      openGoogleMap(target);
      break;
  }
}

/**
 * 위치 정보를 클립보드에 포맷팅하여 복사
 */
export async function copyLocationText(place: NavigationTarget): Promise<boolean> {
  const kakaoLink = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  const googleLink = `https://www.google.com/maps?q=${place.latitude},${place.longitude}`;

  const text = `📍 [정밀 위치 전달: ${place.name}]
• 주소: ${place.address || '주소 미확인'}
• 좌표: 위도 ${place.latitude.toFixed(6)}, 경도 ${place.longitude.toFixed(6)}
• 카카오맵 길안내: ${kakaoLink}
• 구글지도 위치: ${googleLink}`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 대체 클립보드 복사
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    logger.error('Failed to copy', err);
    return false;
  }
}

/**
 * 스마트폰 시스템 공유 시트 (카카오톡, 문자, 인스타 등 타 앱 전달)
 */
export async function shareLocation(place: NavigationTarget): Promise<boolean> {
  const kakaoLink = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
  const shareData = {
    title: `[위치 공유] ${place.name}`,
    text: `📍 위치: ${place.name}\n주소: ${place.address || '위성 좌표'}\n좌표: (${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)})`,
    url: kakaoLink,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        logger.warn('Share error', e);
      }
      return false;
    }
  } else {
    // navigator.share가 지원되지 않는 환경에서는 클립보드 복사로 대체
    return copyLocationText(place);
  }
}
