import { toKSTDateString, isOverdue, isDueToday, formatDate } from './dateUtils';

describe('toKSTDateString', () => {
  it('UTC → KST 변환 확인 (UTC 15:00 = KST 다음날 00:00)', () => {
    const utcDate = new Date('2024-01-01T15:00:00.000Z');
    expect(toKSTDateString(utcDate)).toBe('2024-01-02');
  });

  it('UTC → KST 변환 확인 (UTC 00:00 = KST 09:00 같은 날)', () => {
    const utcDate = new Date('2024-06-15T00:00:00.000Z');
    expect(toKSTDateString(utcDate)).toBe('2024-06-15');
  });
});

describe('isOverdue', () => {
  it('지난 날짜에 대해 true 반환', () => {
    expect(isOverdue('2000-01-01')).toBe(true);
  });

  it('미래 날짜에 대해 false 반환', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });

  it('null에 대해 false 반환', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('undefined에 대해 false 반환', () => {
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe('isDueToday', () => {
  it('오늘 날짜에 대해 true 반환', () => {
    const today = toKSTDateString();
    expect(isDueToday(today)).toBe(true);
  });

  it('다른 날짜에 대해 false 반환', () => {
    expect(isDueToday('2000-01-01')).toBe(false);
  });

  it('null에 대해 false 반환', () => {
    expect(isDueToday(null)).toBe(false);
  });

  it('undefined에 대해 false 반환', () => {
    expect(isDueToday(undefined)).toBe(false);
  });
});

describe('formatDate', () => {
  it('null 처리 - "-" 반환', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('undefined 처리 - "-" 반환', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('빈 문자열 처리 - "-" 반환', () => {
    expect(formatDate('')).toBe('-');
  });

  it('날짜 문자열 포맷 변환', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/2024/);
  });
});
