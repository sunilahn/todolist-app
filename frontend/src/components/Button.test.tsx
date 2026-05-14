import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked normally', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when loading', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows Spinner when loading', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByLabelText('로딩 중')).toBeInTheDocument();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-primary');
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-white');
    expect(screen.getByRole('button').className).toContain('text-primary');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-danger');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Click</Button>);
    expect(screen.getByRole('button').className).toContain('bg-transparent');
  });

  it('applies sm size classes', () => {
    render(<Button size="sm">Click</Button>);
    expect(screen.getByRole('button').className).toContain('px-4');
  });

  it('applies md size classes', () => {
    render(<Button size="md">Click</Button>);
    expect(screen.getByRole('button').className).toContain('px-6');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Click</Button>);
    expect(screen.getByRole('button').className).toContain('px-8');
  });
});
