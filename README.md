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
- 띄어쓰기 자동 정규화 ("황금3로7번길56" → "황금3로7번길 56")
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

### 6. 테스트 위치
- 모의 위치 설정 (강남역, 판교, 해운대)
- 개발/테스트 환경에서 GPS 없이 위치 시뮬레이션

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript 6, TailwindCSS 4 |
| 빌드 | Vite 8 |
| 모바일 | Capacitor 8 (하이브리드 Android) |
| 지도 | Leaflet + OpenStreetMap |
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
# 웹 빌드
pnpm build

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
│   │   └── TestLocationPanel.tsx  # 테스트 위치 패널
│   ├── hooks/               # 커스텀 훅
│   │   ├── useLocationManagement.ts  # 위치 관리
│   │   └── usePlaceManagement.ts     # 장소 관리
│   ├── services/            # 비즈니스 로직
│   │   ├── locationService.ts    # GPS + 주소 검색
│   │   ├── navigationService.ts  # 네비게이션 딥링크
│   │   ├── routeService.ts       # 경로 계산
│   │   └── storageService.ts     # 로컬 스토리지
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

- [OpenStreetMap](https://www.openstreetmap.org/) — 지도 데이터
- [Nominatim](https://nominatim.openstreetmap.org/) — 주소 검색 API
- [OSRM](http://project-osrm.org/) — 경로 계산 API
- [Capacitor](https://capacitorjs.com/) — 하이브리드 모바일 프레임워크
- [Leaflet](https://leafletjs.com/) — 지도 라이브러리

---

**Made by h.k Lee & Sisyphus**
