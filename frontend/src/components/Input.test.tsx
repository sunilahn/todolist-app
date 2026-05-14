import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input placeholder="입력" />);
    expect(screen.getByPlaceholderText('입력')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="이름" />);
    expect(screen.getByText('이름')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Input error="필수 항목입니다" />);
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument();
  });

  it('sets aria-invalid to true when error prop is provided', () => {
    render(<Input error="오류" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders hint text', () => {
    render(<Input hint="힌트 메시지" />);
    expect(screen.getByText('힌트 메시지')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
