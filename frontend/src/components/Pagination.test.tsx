import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('calls onPageChange with previous page when 이전 button is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByLabelText('이전 페이지'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when 다음 button is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByLabelText('다음 페이지'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables 이전 button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled();
  });

  it('disables 다음 button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled();
  });

  it('highlights current page button', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const pageButton = buttons.find((btn) => btn.textContent === '2');
    expect(pageButton?.className).toContain('bg-primary');
  });

  it('calls onPageChange when page number is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
