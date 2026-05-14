import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={vi.fn()}>내용</Modal>);
    expect(screen.queryByText('내용')).not.toBeInTheDocument();
  });

  it('renders children when isOpen is true', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>);
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}>내용</Modal>);
    await userEvent.click(screen.getByLabelText('닫기'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}>내용</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<Modal isOpen onClose={onClose}>내용</Modal>);
    const overlay = container.firstChild as HTMLElement;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onClose when panel is clicked', async () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose}>내용</Modal>);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(<Modal isOpen onClose={vi.fn()}>내용</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
