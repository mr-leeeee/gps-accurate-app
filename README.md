# 정밀 GPS 위치 알림이

고정밀 GPS 센서를 활용한 위치 측정 및 네비게이션 연동 하이브리드 모바일 앱

---

## 만든 사람

- **h.k Lee** — 기획, 개발, 설계
- **Sisyphus (AI)** — 코드 구현, 테스트, 최적화

---

## 기능 소개

### 1. 현재 위치 측정
- 스마트폰 GPS 센서를 통한 고정밀 위치 측정
- GPS 오차 범위(±m) 시각화 (excellent/good/fair/poor)
- 위도, 경도, 고도, 방향, 속도 표시
- 역지오코딩을 통한 한글 주소 변환 (OSM Nominatim)

### 2. 장소 관리
- 측정한 위치를 장소 목록에 저장
- 커스텀 이름 지정 (예: "집", "회사", "약속 장소")
- 메모 추가 기능
- 장소 삭제 및 전체 삭제

### 3. 주소 검색
- 주소 직접 입력으로 장소 추가
- 띄어쓰기 자동 정규화 ("소금3로17번길156" → "소금3로17번길 156")
- Nominatim API를 통한 주소 검증
- 오프라인 캐시 지원 (최근 검색 결과 24시간 보관)

### 4. 네비게이션 연동
- **카카오맵** — 길안내 바로 실행
- **네이버 지도** — 길안내 바로 실행
- **구글 지도** — 길안내 바로 실행
- 위치 정보 클립보드 복사
- 카카오톡/메신저 공유

### 5. 최적 동선
- 다중 장소 경유 경로 계산
- OSRM API를 통한 도로 주행거리 산출
- 지도에 경로 표시

### 6. VWorld 국내 지도 및 개인 인증키
- 브이월드(공간정보 오픈플랫폼) WMTS 베이스맵 — zoom 6~19
- 앱 내 헤더의 열쇠 아이콘으로 개인 인증키와 만료일을 직접 입력·저장 (git에 커밋되지 않음)
- 저장 즉시 실행 중 지도에 반영되며, 앱을 다시 꺼도 유지
- 만료일 입력 시 임박(14일) 경고, 만료 시 자동으로 OSM 기본 타일로 폴백
- 인증키 미설정·만료 상태는 헤더 표시등(회색/초록/노랑/빨강)으로 확인
- 위성(ESRI World Imagery) 레이어는 API 키 없이 무료로 제공

### 7. 테스트 위치 (고스트 모드 전용)
- 모의 위치 설정 (강남역, 판교, 해운대)
- `pnpm build:ghost`로 빌드할 때만 활성화되며, 일반 빌드에서는 코드 자체가 번들에 포함되지 않음
- GPS 실패 시 기본 좌표 표시, 저장 목록 최초 실행 시 샘플 장소 주입도 고스트 모드 전용

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript 6, TailwindCSS 4 |
| 빌드 | Vite 8 |
| 모바일 | Capacitor 8 (하이브리드 Android) |
| 지도 | Leaflet + VWorld(브이월드) / OpenStreetMap |
| 테스트 | Vitest 5 |
| 패키지 매니저 | pnpm |

---

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- pnpm
- Android Studio (Android 빌드 시)
- adb (실기기 설치 시)

### 개발 서버 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev
```

### 빌드

```bash
# 웹 빌드 (배포용 — 테스트 도구 미포함)
pnpm build

# 고스트 빌드 (테스트 도구 포함 — 실기기 배포 금지)
pnpm build:ghost

# Android 빌드
npx cap sync android
cd android
./gradlew assembleDebug
```

### 실기기 설치

```bash
# adb 연결 확인
adb devices

# APK 설치
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 프로젝트 구조

```
gps/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── AddAddressModal.tsx    # 주소 검색 모달
│   │   ├── CurrentLocationCard.tsx # 현재 위치 카드
│   │   ├── EditModal.tsx          # 장소 편집 모달
│   │   ├── MapViewer.tsx          # 지도 뷰어
│   │   ├── NavigationModal.tsx    # 네비게이션 선택 모달
│   │   ├── PlaceItem.tsx          # 장소 목록 항목
│   │   ├── PlaceList.tsx          # 장소 목록
│   │   ├── RouteOptimizeModal.tsx # 최적 동선 모달
│   │   ├── TestLocationPanel.tsx  # 테스트 위치 패널
│   │   ├── VWorldKeyForm.tsx      # 인증키·만료일 입력 폼
│   │   └── VWorldKeyModal.tsx     # 인증키 설정 모달 셸
│   ├── hooks/               # 커스텀 훅
│   │   ├── useLocationManagement.ts  # 위치 관리
│   │   ├── usePlaceManagement.ts     # 장소 관리
│   │   └── useVWorldKey.ts           # 인증키 상태 및 지도 설정
│   ├── services/            # 비즈니스 로직
│   │   ├── locationService.ts    # GPS + 주소 검색
│   │   ├── navigationService.ts  # 네비게이션 딥링크
│   │   ├── routeService.ts       # 경로 계산
│   │   ├── storageService.ts     # 로컬 스토리지
│   │   └── vworldKeyService.ts   # 인증키 저장 및 만료일 계산
│   ├── types/               # TypeScript 타입
│   │   ├── errors.ts             # 커스텀 에러 클래스
│   │   └── location.ts           # 위치/장소 타입
│   ├── utils/               # 유틸리티
│   │   ├── env.ts                # 환경 변수 검증
│   │   └── logger.ts             # 구조화된 로거
│   ├── constants.ts         # 상수 정의
│   ├── App.tsx              # 메인 컴포넌트
│   └── main.tsx             # 진입점
├── android/                 # Android 네이티브 코드
├── public/                  # 정적 리소스
├── .env                     # 환경 변수 (프로덕션)
├── .env.development         # 환경 변수 (개발)
├── capacitor.config.ts      # Capacitor 설정
├── tsconfig.json            # TypeScript 설정
├── vite.config.ts           # Vite + Vitest 설정
└── package.json             # 의존성
```

---

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VITE_APP_NAME` | 앱 이름 | 정밀 GPS |
| `VITE_APP_VERSION` | 앱 버전 | 1.0.0-beta |
| `VITE_API_TIMEOUT` | API 타임아웃 (ms) | 10000 |
| `VITE_REVERSE_GEOCODE_TIMEOUT` | 역지오코딩 타임아웃 (ms) | 4000 |
| `VITE_OSRM_TIMEOUT` | OSRM 타임아웃 (ms) | 6000 |
| `VITE_DEFAULT_LATITUDE` | 기본 위도 | 37.566535 |
| `VITE_DEFAULT_LONGITUDE` | 기본 경도 | 126.977969 |
| `VITE_GHOST_MODE` | 테스트 도구 활성화 (`.env.ghost`에서 `1`로 설정) | 미설정 |
| `VITE_VWORLD_TILE_KEY` | VWorld 인증키(빌드 시 기본값). **저장 기록이 없을 때만** 쓰이며, 앱에서 저장한 개인 키가 우선합니다. 저장한 키가 만료되면 이 값으로 되돌아가지 않고 OSM으로 폴백합니다 | 미설정 |

---

## VWorld 인증키 사용법

국내 정밀 지도를 쓰려면 브이월드(공간정보 오픈플랫폼)에서 무료 인증키를 받아야 합니다.
앱 안에서 직접 입력하면 **git에 커밋되지 않고** 기기의 WebView `localStorage`에만
저장됩니다. 다만 기기 저장소는 비밀 금고가 아니므로 아래 [인증키 보안](#인증키-보안)을
반드시 확인하세요.

1. [브이월드 포털](https://www.vworld.kr/v4po_main.do) 회원가입 및 로그인
   - 아직 회원이 없다면 [회원가입](https://www.vworld.kr/v4po_usrcla_a002.do)
2. 상단 메뉴 **오픈API** → **인증키 발급** 진입
3. 서비스는 반드시 **2D 지도 API**로 선택하고, 도메인/IP 또는 인증서를 설정
4. 발급된 인증키를 복사해 앱 헤더의 열쇠 아이콘 → **인증키 입력** 화면에 붙여넣기

인증키는 보통 발급 후 6개월간 유효하며 최대 3회 연장(총 12개월) 가능합니다. 인증키와
만료일을 함께 저장하면 만료 임박 시 헤더 표시등이 노란색으로 바뀌고, 만료되면
자동으로 OSM 기본 타일로 폴백되어 지도 사용이 중단되지는 않습니다.

> 빌드 시 기본 키를 배포자에 넣고 싶다면 추적 제외된 `.env.local`에
> `VITE_VWORLD_TILE_KEY`를 설정하세요. 앱에서 입력한 개인 키가 항상 우선하며,
> 저장 기록을 지우면 이 기본 키로 돌아갑니다. 단 저장한 키가 **만료**된 경우에는
> 기본 키로 되돌아가지 않고 OSM으로 폴백합니다 — 두 키가 같은 경우가 많아
> 되돌아가도 타일만 깨지고, 만료 표시와 실제 지도가 어긋나기 때문입니다.

### 인증키 보안

`VITE_` 환경 변수는 **빌드 시 JS 번들에 인라인**됩니다. APK는 `assets/public/*.js`로
풀 수 있으므로 `VITE_VWORLD_TILE_KEY`를 넣은 번들에서는 그 키가 그대로 추출됩니다.
즉 **빌드타임 키는 secret이 아닙니다.**

앱 안에서 입력한 키도 WebView `localStorage`에 남으므로 루팅된 기기나 디버그 빌드에서는
마찬가지로 읽힙니다.

따라서 어떤 방식으로 키를 넣든 브이월드 포털에서 반드시 **도메인/IP 제한**을 걸어야 합니다.

| 키 위치 | 노출 경로 | 방어선 |
|---------|-----------|--------|
| 빌드타임 `VITE_VWORLD_TILE_KEY` | APK → JS 번들 역추출 | 포털 도메인/IP 제한 |
| 앱 입력 키 | 기기 `localStorage` | 포털 도메인/IP 제한 |
| git 커밋 | 이력에 평문 잔존 | 커밋 제외 + 포털 제한 |

git에 키를 커밋하지 않는 것만으로는 배포 산출물에서의 노출이 막히지 않습니다.
제한 설정이 유일한 방어선입니다.

---

## 테스트

```bash
# 전체 테스트 실행
pnpm vitest run

# 특정 파일 테스트
pnpm vitest run src/services/locationService.test.ts

# 테스트 커버리지 확인
pnpm vitest run --coverage
```

---

## 주요 설계 결정

### 1. 아키텍처
- **훅 기반 상태 관리**: `useLocationManagement`, `usePlaceManagement`로 관심사 분리
- **서비스 레이어 분리**: GPS, 주소 검색, 네비게이션, 저장소 로직 분리
- **커스텀 에러 클래스**: `AppError` → `GeolocationError`, `NetworkError`, `StorageError`

### 2. 성능 최적화
- **메모리 캐시**: 5분 TTL로 동일 쿼리 재요청 방지
- **로컬 스토리지 캐시**: 24시간 오프라인 지원
- **Rate Limit**: Nominatim API 1초당 1요청 제한 준수

### 3. 에러 처리
- 모든 예외는 `logger.warn/error`로 기록
- 빈 `catch {}` 없음
- 사용자 친화적 에러 메시지

### 4. 접근성
- `aria-label`, `role` 속성 적용
- 키보드 네비게이션 지원
- 포커스 링 표시

---

## 라이선스

MIT License

---

## 감사의 말

- [브이월드](https://www.vworld.kr/) — 국내 지도 데이터 (VWorld 인증키 사용 시)
- [OpenStreetMap](https://www.openstreetmap.org/) — 지도 데이터 (폴백)
- [Nominatim](https://nominatim.openstreetmap.org/) — 주소 검색 API
- [OSRM](http://project-osrm.org/) — 경로 계산 API
- [Capacitor](https://capacitorjs.com/) — 하이브리드 모바일 프레임워크
- [Leaflet](https://leafletjs.com/) — 지도 라이브러리

---

**Made by h.k Lee & Sisyphus**
