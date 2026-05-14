import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  it('applies md size classes by default', () => {
    render(<Spinner />);
    const el = screen.getByLabelText('로딩 중');
    expect(el.className).toContain('w-5');
    expect(el.className).toContain('h-5');
  });

  it('has aria-label "로딩 중"', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });
});
