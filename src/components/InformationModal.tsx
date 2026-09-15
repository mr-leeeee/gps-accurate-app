import React from 'react';
import {
  X,
  MapPin,
  Navigation,
  Search,
  Route,
  Smartphone,
  Shield,
  Clock,
  Database,
  Code2,
  Heart,
} from 'lucide-react';

interface InformationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl text-slate-100 max-h-[85vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">정밀 GPS 위치 알림이</h2>
              <p className="text-[11px] text-slate-400">v1.0.0-beta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* 앱 소개 */}
          <section>
            <h3 className="text-sm font-bold text-white mb-2">앱 소개</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              고정밀 GPS 센서를 활용하여 현재 위치를 측정하고, 저장된 장소를 관리하며,
              카카오맵/네이버지도/구글맵으로 즉시 길안내를 시작할 수 있는 하이브리드 모바일
              앱입니다.
            </p>
          </section>

          {/* 주요 기능 */}
          <section>
            <h3 className="text-sm font-bold text-white mb-3">주요 기능</h3>
            <div className="space-y-2">
              <FeatureItem
                icon={<MapPin className="w-4 h-4" />}
                title="현재 위치 측정"
                description="GPS 센서로 위도, 경도, 오차 범위를 정밀 측정합니다"
                color="emerald"
              />
              <FeatureItem
                icon={<Search className="w-4 h-4" />}
                title="주소 검색"
                description="직접 주소를 입력하여 장소를 추가할 수 있습니다"
                color="blue"
              />
              <FeatureItem
                icon={<Navigation className="w-4 h-4" />}
                title="네비게이션 연동"
                description="카카오맵, 네이버, 구글맵으로 길안내를 바로 시작합니다"
                color="purple"
              />
              <FeatureItem
                icon={<Route className="w-4 h-4" />}
                title="최적 동선"
                description="여러 장소를 경유하는 최적 경로를 계산합니다"
                color="amber"
              />
              <FeatureItem
                icon={<Database className="w-4 h-4" />}
                title="오프라인 지원"
                description="이전 검색 결과는 네트워크 없이도 확인 가능합니다"
                color="cyan"
              />
            </div>
          </section>

          {/* 사용법 */}
          <section>
            <h3 className="text-sm font-bold text-white mb-3">사용법</h3>
            <div className="space-y-3">
              <UsageStep
                step={1}
                title="위치 측정"
                description="[위치 측정] 버튼을 눌러 현재 위치를 측정합니다"
              />
              <UsageStep
                step={2}
                title="장소 저장"
                description="[장소 목록에 저장] 버튼으로 위치를 저장합니다"
              />
              <UsageStep
                step={3}
                title="이름 지정"
                description="저장된 장소를 눌러 이름을 변경할 수 있습니다"
              />
              <UsageStep
                step={4}
                title="길안내"
                description="[길안내] 버튼으로 네비게이션 앱을 선택합니다"
              />
            </div>
          </section>

          {/* 기술 정보 */}
          <section>
            <h3 className="text-sm font-bold text-white mb-3">기술 정보</h3>
            <div className="grid grid-cols-2 gap-2">
              <TechBadge icon={<Code2 className="w-3 h-3" />} label="React 19" />
              <TechBadge icon={<Code2 className="w-3 h-3" />} label="TypeScript" />
              <TechBadge icon={<Smartphone className="w-3 h-3" />} label="Capacitor 8" />
              <TechBadge icon={<Shield className="w-3 h-3" />} label="Vite 8" />
            </div>
          </section>

          {/* 오픈소스 */}
          <section>
            <h3 className="text-sm font-bold text-white mb-2">오픈소스</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              OpenStreetMap (지도), Nominatim (주소 검색), OSRM (경로 계산), Leaflet (지도
              라이브러리)
            </p>
          </section>
        </div>

        {/* 하단 정보 */}
        <div className="px-5 py-4 border-t border-slate-800 text-center shrink-0">
          <p className="text-[11px] text-slate-500">
            Made with <Heart className="w-3 h-3 inline text-red-400" /> by h.k Lee &
            Sisyphus
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            <Clock className="w-3 h-3 inline" /> {new Date().getFullYear()} GPS Accuracy
            App
          </p>
        </div>
      </div>
    </div>
  );
};

function FeatureItem({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/50">
      <div className={`p-1.5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function UsageStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-bold shrink-0">
        {step}
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function TechBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300">
      {icon}
      {label}
    </div>
  );
}
