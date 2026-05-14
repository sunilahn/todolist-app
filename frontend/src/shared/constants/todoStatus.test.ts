import { ALLOWED_TRANSITIONS } from './todoStatus';

describe('ALLOWED_TRANSITIONS', () => {
  it('PLANNED에서 DONE으로 전이 불가', () => {
    expect(ALLOWED_TRANSITIONS.PLANNED).not.toContain('DONE');
  });

  it('PLANNED에서 IN_PROGRESS로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.PLANNED).toContain('IN_PROGRESS');
  });

  it('PLANNED에서 ON_HOLD로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.PLANNED).toContain('ON_HOLD');
  });

  it('IN_PROGRESS에서 PLANNED로 전이 불가', () => {
    expect(ALLOWED_TRANSITIONS.IN_PROGRESS).not.toContain('PLANNED');
  });

  it('IN_PROGRESS에서 DONE으로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.IN_PROGRESS).toContain('DONE');
  });

  it('IN_PROGRESS에서 ON_HOLD로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.IN_PROGRESS).toContain('ON_HOLD');
  });

  it('DONE에서 IN_PROGRESS로 전이 가능 (재개 허용)', () => {
    expect(ALLOWED_TRANSITIONS.DONE).toContain('IN_PROGRESS');
  });

  it('DONE에서 PLANNED로 전이 불가', () => {
    expect(ALLOWED_TRANSITIONS.DONE).not.toContain('PLANNED');
  });

  it('DONE에서 ON_HOLD로 전이 불가', () => {
    expect(ALLOWED_TRANSITIONS.DONE).not.toContain('ON_HOLD');
  });

  it('ON_HOLD에서 PLANNED로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.ON_HOLD).toContain('PLANNED');
  });

  it('ON_HOLD에서 IN_PROGRESS로 전이 가능', () => {
    expect(ALLOWED_TRANSITIONS.ON_HOLD).toContain('IN_PROGRESS');
  });

  it('ON_HOLD에서 DONE으로 전이 불가', () => {
    expect(ALLOWED_TRANSITIONS.ON_HOLD).not.toContain('DONE');
  });
});
