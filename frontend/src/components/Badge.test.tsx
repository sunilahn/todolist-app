import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders PLANNED with neutral classes', () => {
    render(<Badge variant="PLANNED" />);
    const el = screen.getByText('예정');
    expect(el.className).toContain('bg-neutral-100');
    expect(el.className).toContain('text-neutral-700');
  });

  it('renders IN_PROGRESS with primary classes', () => {
    render(<Badge variant="IN_PROGRESS" />);
    const el = screen.getByText('진행중');
    expect(el.className).toContain('bg-primary-light');
    expect(el.className).toContain('text-primary');
  });

  it('renders DONE with success classes', () => {
    render(<Badge variant="DONE" />);
    const el = screen.getByText('완료');
    expect(el.className).toContain('bg-success-light');
    expect(el.className).toContain('text-success');
  });

  it('renders ON_HOLD with warning classes', () => {
    render(<Badge variant="ON_HOLD" />);
    const el = screen.getByText('보류');
    expect(el.className).toContain('bg-warning-light');
  });

  it('renders ADMIN with primary classes', () => {
    render(<Badge variant="ADMIN" />);
    const el = screen.getByText('관리자');
    expect(el.className).toContain('bg-primary-light');
    expect(el.className).toContain('text-primary');
  });

  it('renders MEMBER with success classes', () => {
    render(<Badge variant="MEMBER" />);
    const el = screen.getByText('멤버');
    expect(el.className).toContain('bg-success-light');
    expect(el.className).toContain('text-success');
  });

  it('renders VIEWER with neutral classes', () => {
    render(<Badge variant="VIEWER" />);
    const el = screen.getByText('뷰어');
    expect(el.className).toContain('bg-neutral-100');
    expect(el.className).toContain('text-neutral-500');
  });

  it('overrides default label with label prop', () => {
    render(<Badge variant="PLANNED" label="사용자 레이블" />);
    expect(screen.getByText('사용자 레이블')).toBeInTheDocument();
    expect(screen.queryByText('예정')).not.toBeInTheDocument();
  });

  it('shows default label when label prop is not provided', () => {
    render(<Badge variant="DONE" />);
    expect(screen.getByText('완료')).toBeInTheDocument();
  });
});
