import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoStatusSelect } from './TodoStatusSelect';

describe('TodoStatusSelect', () => {
  it('PLANNED 상태: IN_PROGRESS, ON_HOLD 옵션만 렌더링됨 (DONE 없음)', () => {
    render(
      <TodoStatusSelect currentStatus="PLANNED" onChange={() => {}} />
    );
    expect(screen.getByRole('option', { name: '진행중' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '보류' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '완료' })).not.toBeInTheDocument();
  });

  it('IN_PROGRESS 상태: DONE, ON_HOLD 옵션만 렌더링됨', () => {
    render(
      <TodoStatusSelect currentStatus="IN_PROGRESS" onChange={() => {}} />
    );
    expect(screen.getByRole('option', { name: '완료' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '보류' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '예정' })).not.toBeInTheDocument();
  });

  it('DONE 상태: IN_PROGRESS 옵션만 렌더링됨', () => {
    render(
      <TodoStatusSelect currentStatus="DONE" onChange={() => {}} />
    );
    expect(screen.getByRole('option', { name: '진행중' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '예정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '보류' })).not.toBeInTheDocument();
  });

  it('ON_HOLD 상태: PLANNED, IN_PROGRESS 옵션만 렌더링됨', () => {
    render(
      <TodoStatusSelect currentStatus="ON_HOLD" onChange={() => {}} />
    );
    expect(screen.getByRole('option', { name: '예정' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '진행중' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '완료' })).not.toBeInTheDocument();
  });

  it('onChange 콜백이 올바른 값으로 호출됨', async () => {
    const onChange = vi.fn();
    render(
      <TodoStatusSelect currentStatus="PLANNED" onChange={onChange} />
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), '진행중');
    expect(onChange).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('disabled prop 전달 시 select 비활성화됨', () => {
    render(
      <TodoStatusSelect currentStatus="PLANNED" onChange={() => {}} disabled />
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
