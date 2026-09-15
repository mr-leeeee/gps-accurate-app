import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlaceItem } from './PlaceItem';
import type { SavedPlace } from '../types/location';

const mockPlace: SavedPlace = {
  id: 'test-1',
  customName: '테스트 장소',
  originalAddress: '서울특별시 강남구 테헤란로 152',
  latitude: 37.50005,
  longitude: 127.0365,
  accuracy: 4.8,
  altitude: 12.0,
  timestamp: Date.now(),
  memo: '테스트 메모',
};

const defaultProps = {
  place: mockPlace,
  isSelected: false,
  onSelect: vi.fn(),
  onNavigate: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onShare: vi.fn(),
  onRouteToThis: vi.fn(),
};

describe('PlaceItem', () => {
  it('장소 이름과 주소를 렌더링한다', () => {
    render(<PlaceItem {...defaultProps} />);
    expect(screen.getByText('테스트 장소')).toBeDefined();
    expect(screen.getByText('서울특별시 강남구 테헤란로 152')).toBeDefined();
  });

  it('정확도 배지를 표시한다', () => {
    render(<PlaceItem {...defaultProps} />);
    expect(screen.getByText('±4.8m')).toBeDefined();
  });

  it('메모가 있으면 표시한다', () => {
    render(<PlaceItem {...defaultProps} />);
    expect(screen.getByText('메모: 테스트 메모')).toBeDefined();
  });

  it('메모가 없으면 메모 영역을 렌더링하지 않는다', () => {
    const noMemoPlace = { ...mockPlace, memo: undefined };
    render(<PlaceItem {...defaultProps} place={noMemoPlace} />);
    expect(screen.queryByText(/^메모:/)).toBeNull();
  });

  it('선택된 장소는 다른 스타일을 적용한다', () => {
    const { container } = render(<PlaceItem {...defaultProps} isSelected={true} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-blue-500');
  });

  it('카드 클릭 시 onSelect를 호출한다', () => {
    render(<PlaceItem {...defaultProps} />);
    const nameArea = screen.getByText('테스트 장소');
    fireEvent.click(nameArea);
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('키보드 Enter로 onSelect를 호출한다', () => {
    render(<PlaceItem {...defaultProps} />);
    const nameArea = screen.getByText('테스트 장소');
    fireEvent.keyDown(nameArea, { key: 'Enter' });
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  it('길안내 버튼 클릭 시 onNavigate를 호출한다', () => {
    render(<PlaceItem {...defaultProps} />);
    const navBtn = screen.getByText('길안내');
    fireEvent.click(navBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledTimes(1);
  });

  it('변경 버튼 클릭 시 onEdit을 호출한다', () => {
    render(<PlaceItem {...defaultProps} />);
    const editBtn = screen.getByText(/변경/);
    fireEvent.click(editBtn);
    expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
  });

  it('상세 좌표 펼치기/접기 토글이 동작한다', () => {
    render(<PlaceItem {...defaultProps} />);
    const toggleBtn = screen.getByLabelText('상세 좌표 펼치기');
    fireEvent.click(toggleBtn);
    expect(screen.getByText('위도 (Lat):')).toBeDefined();
    expect(screen.getByText('경도 (Lng):')).toBeDefined();

    const collapseBtn = screen.getByLabelText('상세 좌표 접기');
    fireEvent.click(collapseBtn);
    expect(screen.queryByText('위도 (Lat):')).toBeNull();
  });

  it('접근성 속성이 올바르게 적용된다', () => {
    render(<PlaceItem {...defaultProps} />);
    const card = screen.getByRole('article', { name: '테스트 장소' });
    expect(card).toBeDefined();
  });
});
