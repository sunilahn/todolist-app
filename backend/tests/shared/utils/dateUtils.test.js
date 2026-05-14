import { jest, describe, it, expect, afterEach } from '@jest/globals';
import { getKSTToday, getKSTTodayString, getKSTWeekRange } from '../../../src/shared/utils/dateUtils.js';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

describe('dateUtils — KST 날짜 유틸리티', () => {
  describe('getKSTToday()', () => {
    it('Date 객체를 반환한다', () => {
      expect(getKSTToday()).toBeInstanceOf(Date);
    });

    it('반환값이 KST 기준 자정(00:00:00.000)이다', () => {
      const result = getKSTToday();
      // KST 기준 시각으로 변환
      const kstMs = result.getTime() + KST_OFFSET_MS;
      expect(kstMs % 86_400_000).toBe(0); // 자정 = 하루(ms) 의 나머지 0
    });

    it('오늘 날짜의 KST 자정을 반환한다 (UTC 표현)', () => {
      const result = getKSTToday();
      const expectedDateStr = getKSTTodayString();
      // result를 KST 날짜 문자열로 변환
      const resultKstStr = new Date(result.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
      expect(resultKstStr).toBe(expectedDateStr);
    });
  });

  describe('getKSTTodayString()', () => {
    it('YYYY-MM-DD 형식의 문자열을 반환한다', () => {
      const result = getKSTTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('반환된 날짜가 UTC 기준 오늘 또는 내일이다 (KST = UTC+9)', () => {
      const kstStr = getKSTTodayString();
      const kstDate = new Date(kstStr + 'T00:00:00Z');
      const nowUtc = new Date();
      const utcDateStr = nowUtc.toISOString().slice(0, 10);
      const tomorrowUtc = new Date(nowUtc.getTime() + 86_400_000).toISOString().slice(0, 10);
      expect([utcDateStr, tomorrowUtc]).toContain(kstStr.slice(0, 10));

      // KST 날짜는 UTC 날짜보다 최대 1일 앞설 수 있음
      expect(kstDate.getTime() - new Date(utcDateStr).getTime()).toBeLessThanOrEqual(86_400_000);
    });

    it('고정 시각으로 날짜 계산을 검증한다 (2026-05-13 10:00 UTC = 2026-05-13 KST)', () => {
      const fixedUtcMs = new Date('2026-05-13T10:00:00Z').getTime(); // KST 19:00
      jest.spyOn(Date, 'now').mockReturnValue(fixedUtcMs);

      const result = getKSTTodayString();
      expect(result).toBe('2026-05-13');

      Date.now.mockRestore();
    });

    it('UTC 23:00 시각에는 KST로 다음날이 반환된다', () => {
      // 2026-05-13 23:00 UTC = 2026-05-14 08:00 KST
      const fixedUtcMs = new Date('2026-05-13T23:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(fixedUtcMs);

      const result = getKSTTodayString();
      expect(result).toBe('2026-05-14');

      Date.now.mockRestore();
    });
  });

  describe('getKSTWeekRange()', () => {
    it('start, end 키를 가진 객체를 반환한다', () => {
      const result = getKSTWeekRange();
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
    });

    it('start, end 모두 YYYY-MM-DD 형식이다', () => {
      const { start, end } = getKSTWeekRange();
      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('end가 start보다 6일 후다', () => {
      const { start, end } = getKSTWeekRange();
      const diff = (new Date(end) - new Date(start)) / 86_400_000;
      expect(diff).toBe(6);
    });

    it('start가 월요일이다', () => {
      const { start } = getKSTWeekRange();
      // YYYY-MM-DD + 'T00:00:00Z' 로 파싱하면 UTC 월요일 기준
      const startDay = new Date(start + 'T00:00:00Z').getUTCDay();
      expect(startDay).toBe(1); // 1 = Monday
    });

    it('end가 일요일이다', () => {
      const { end } = getKSTWeekRange();
      const endDay = new Date(end + 'T00:00:00Z').getUTCDay();
      expect(endDay).toBe(0); // 0 = Sunday
    });

    it('수요일(KST) 기준 이번 주 월~일 범위를 반환한다', () => {
      // 2026-05-13 수요일 10:00 UTC = 2026-05-13 KST 19:00 (수요일)
      // 이번 주: 2026-05-11 (월) ~ 2026-05-17 (일)
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-13T10:00:00Z').getTime());

      const { start, end } = getKSTWeekRange();
      expect(start).toBe('2026-05-11');
      expect(end).toBe('2026-05-17');

      Date.now.mockRestore();
    });

    it('일요일(KST) 기준 같은 주의 월~일 범위를 반환한다', () => {
      // 2026-05-17 20:00 UTC = 2026-05-18 05:00 KST (일요일)
      // 이번 주: 2026-05-18 (월)이 아닌 2026-05-11~17 (일요일은 그 주의 마지막)
      // 실제로 일요일 = 지난 월요일부터 오늘까지
      // 2026-05-18 05:00 KST → dayOfWeek = 0(Sun) → diffToMonday = -6
      // → Monday = 2026-05-12... 잠깐 다시 계산
      // 2026-05-17 (일) KST 날짜 기준
      // 2026-05-17T15:00:00Z = 2026-05-18T00:00:00 KST (일요일 자정 == 새로운 날 시작이므로 18일 일요일)
      // 실제로 2026-05-17 KST 일요일로 만들려면:
      // 2026-05-17 = 일요일 (확인 필요)
      // new Date('2026-05-17').getDay() 을 직접 계산: 2026-05-17 = ?
      // 이미 위에서 2026-05-11이 월요일, +6 = 2026-05-17이 일요일임을 확인
      // 따라서 2026-05-17 UTC 10:00 = KST 19:00 (일요일)
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-17T10:00:00Z').getTime());

      const { start, end } = getKSTWeekRange();
      expect(start).toBe('2026-05-11');
      expect(end).toBe('2026-05-17');

      Date.now.mockRestore();
    });

    it('월요일(KST) 기준 이번 주 첫날이 자기 자신이다', () => {
      // 2026-05-11 (월) KST: 2026-05-11T01:00:00Z (KST 10:00)
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-11T01:00:00Z').getTime());

      const { start, end } = getKSTWeekRange();
      expect(start).toBe('2026-05-11');
      expect(end).toBe('2026-05-17');

      Date.now.mockRestore();
    });
  });
});
