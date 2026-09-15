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

  it('장소 목록 헤더와 개수를 표시한다', () => {
    render(<PlaceList {...defaultProps} />);
    expect(screen.getByText('저장된 장소 목록')).toBeDefined();
    expect(screen.getByText('2개')).toBeDefined();
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
    const addBtn = screen.getByText('주소 추가');
    fireEvent.click(addBtn);
    expect(defaultProps.onOpenAddAddressModal).toHaveBeenCalledTimes(1);
  });

  it('최적 동선 버튼 클릭 시 onOpenRouteOptimizer을 호출한다', () => {
    render(<PlaceList {...defaultProps} />);
    const routeBtn = screen.getByText('최적 동선');
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
