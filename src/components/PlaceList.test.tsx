import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaceList } from './PlaceList';
import type { SavedPlace } from '../types/location';

const mockPlaces: SavedPlace[] = [
  {
    id: 'place-1',
    customName: '강남역',
    originalAddress: '서울특별시 강남구 강남대로 390',
    latitude: 37.498095,
    longitude: 127.02761,
    accuracy: 3.2,
    altitude: 15.0,
    timestamp: Date.now(),
    memo: '',
  },
  {
    id: 'place-2',
    customName: '판교 테크노밸리',
    originalAddress: '경기도 성남시 분당구 판교역로 235',
    latitude: 37.402056,
    longitude: 127.10862,
    accuracy: 5.5,
    altitude: 42.0,
    timestamp: Date.now(),
    memo: '회의실 A',
  },
];

const defaultProps = {
  places: mockPlaces,
  selectedPlace: null,
  onSelectPlace: vi.fn(),
  onNavigatePlace: vi.fn(),
  onEditPlace: vi.fn(),
  onDeletePlace: vi.fn(),
  onClearAllPlaces: vi.fn(),
  onSharePlace: vi.fn(),
  onRouteToPlace: vi.fn(),
  onOpenRouteOptimizer: vi.fn(),
  onOpenAddAddressModal: vi.fn(),
};

describe('PlaceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('장소 목록 개수를 배지로 표시한다', () => {
    render(<PlaceList {...defaultProps} />);
    expect(screen.getByText('저장된 장소 2개')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
  });

  it('툴바 버튼은 아이콘만 노출하고 제목을 aria-label로 제공한다', () => {
    render(
      <PlaceList
        {...defaultProps}
        onOpenTrash={vi.fn()}
        onImportBackup={vi.fn()}
        onExportBackup={vi.fn()}
        trashCount={0}
      />
    );
    expect(screen.getByLabelText('도로명 또는 지번 주소 직접 입력')).toBeDefined();
    expect(screen.getByLabelText('최적 동선 계산')).toBeDefined();
    expect(screen.getByLabelText('휴지통 열기')).toBeDefined();
    expect(screen.getByLabelText('장소 목록 백업 파일 만들기')).toBeDefined();
    expect(screen.getByLabelText('백업 파일에서 장소 목록 불러오기')).toBeDefined();
    expect(screen.getByLabelText('전체 장소를 휴지통으로 옮기기')).toBeDefined();
  });

  it('휴지통에 삭제된 장소가 있으면 개수를 aria-label에 포함한다', () => {
    render(<PlaceList {...defaultProps} onOpenTrash={vi.fn()} trashCount={3} />);
    expect(screen.getByLabelText('휴지통 열기, 삭제된 장소 3개')).toBeDefined();
  });

  it('모든 장소 이름을 렌더링한다', () => {
    render(<PlaceList {...defaultProps} />);
    expect(screen.getByText('강남역')).toBeDefined();
    expect(screen.getByText('판교 테크노밸리')).toBeDefined();
  });

  it('장소 검색이 동작한다', () => {
    render(<PlaceList {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('장소명, 주소, 메모로 검색...');
    fireEvent.change(searchInput, { target: { value: '강남' } });
    
    expect(screen.getByText('강남역')).toBeDefined();
    expect(screen.queryByText('판교 테크노밸리')).toBeNull();
  });

  it('검색 결과가 없으면 안내 메시지를 표시한다', () => {
    render(<PlaceList {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('장소명, 주소, 메모로 검색...');
    fireEvent.change(searchInput, { target: { value: '존재하지않는장소' } });
    
    expect(screen.getByText('검색된 장소가 없습니다.')).toBeDefined();
  });

  it('주소 추가 버튼 클릭 시 onOpenAddAddressModal을 호출한다', () => {
    render(<PlaceList {...defaultProps} />);
    const addBtn = screen.getByLabelText('도로명 또는 지번 주소 직접 입력');
    fireEvent.click(addBtn);
    expect(defaultProps.onOpenAddAddressModal).toHaveBeenCalledTimes(1);
  });

  it('최적 동선 버튼 클릭 시 onOpenRouteOptimizer을 호출한다', () => {
    render(<PlaceList {...defaultProps} />);
    const routeBtn = screen.getByLabelText('최적 동선 계산');
    fireEvent.click(routeBtn);
    expect(defaultProps.onOpenRouteOptimizer).toHaveBeenCalledTimes(1);
  });

  it('장소가 없으면 빈 상태 메시지를 표시한다', () => {
    render(<PlaceList {...defaultProps} places={[]} />);
    expect(screen.getByText('저장된 장소가 없습니다.')).toBeDefined();
  });

  it('접근성 role="list"가 적용된다', () => {
    render(<PlaceList {...defaultProps} />);
    const list = screen.getByRole('list', { name: '저장된 장소 목록' });
    expect(list).toBeDefined();
  });
});
