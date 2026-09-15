import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestLocationPanel } from './TestLocationPanel';
import { MOCK_LOCATIONS } from '../constants';

describe('TestLocationPanel', () => {
  it('테스트 위치 버튼들을 렌더링한다', () => {
    const onSetMockLocation = vi.fn();
    render(<TestLocationPanel onSetMockLocation={onSetMockLocation} />);
    
    MOCK_LOCATIONS.forEach((mock) => {
      expect(screen.getByText(mock.name)).toBeDefined();
    });
  });

  it('버튼 클릭 시 올바른 좌표를 전달한다', () => {
    const onSetMockLocation = vi.fn();
    render(<TestLocationPanel onSetMockLocation={onSetMockLocation} />);
    
    const gangnamBtn = screen.getByText('강남역');
    fireEvent.click(gangnamBtn);
    
    expect(onSetMockLocation).toHaveBeenCalledTimes(1);
    const calledArg = onSetMockLocation.mock.calls[0][0];
    expect(calledArg.latitude).toBe(MOCK_LOCATIONS[0].lat);
    expect(calledArg.longitude).toBe(MOCK_LOCATIONS[0].lng);
    expect(calledArg.address).toBe(MOCK_LOCATIONS[0].addr);
    expect(calledArg.isMock).toBe(true);
  });

  it('접근성 role="group"이 적용된다', () => {
    const onSetMockLocation = vi.fn();
    render(<TestLocationPanel onSetMockLocation={onSetMockLocation} />);
    
    const group = screen.getByRole('group', { name: '테스트 위치 선택' });
    expect(group).toBeDefined();
  });

  it('각 버튼에 aria-label이 적용된다', () => {
    const onSetMockLocation = vi.fn();
    render(<TestLocationPanel onSetMockLocation={onSetMockLocation} />);
    
    MOCK_LOCATIONS.forEach((mock) => {
      const btn = screen.getByRole('button', { name: `${mock.name}으로 테스트 위치 설정` });
      expect(btn).toBeDefined();
    });
  });

  it('세 개의 테스트 위치 버튼이 존재한다', () => {
    const onSetMockLocation = vi.fn();
    render(<TestLocationPanel onSetMockLocation={onSetMockLocation} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });
});
