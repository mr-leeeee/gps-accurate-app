import { RefreshCw } from 'lucide-react';
import type { LocationData } from '../types/location';
import { MOCK_LOCATIONS } from '../constants';

interface TestLocationPanelProps {
  onSetMockLocation: (mock: LocationData) => void;
}

export const TestLocationPanel: React.FC<TestLocationPanelProps> = ({
  onSetMockLocation,
}) => {
  const handleClick = (mock: (typeof MOCK_LOCATIONS)[number]) => {
    const locationData: LocationData = {
      latitude: mock.lat,
      longitude: mock.lng,
      accuracy: 2.8,
      altitude: 42.0,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      address: mock.addr,
      isMock: true,
    };
    onSetMockLocation(locationData);
  };

  return (
    <div className="px-1 py-1.5 bg-slate-900/40 rounded-xl border border-slate-800/80">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" aria-hidden="true" />
          테스트 위치 빠른 설정:
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-1" role="group" aria-label="테스트 위치 선택">
        {MOCK_LOCATIONS.map((mock) => (
          <button
            key={mock.name}
            onClick={() => handleClick(mock)}
            aria-label={`${mock.name}으로 테스트 위치 설정`}
            className="px-2 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] text-slate-300 font-medium truncate border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {mock.name}
          </button>
        ))}
      </div>
    </div>
  );
};