import { describe, it, expect } from '@jest/globals';

// 상태 전이 매트릭스 (서비스 로직과 동일)
const ALLOWED_TRANSITIONS = {
  PLANNED: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['DONE', 'ON_HOLD'],
  DONE: ['IN_PROGRESS'],
  ON_HOLD: ['PLANNED', 'IN_PROGRESS'],
};

function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('isValidTransition - 상태 전이 매트릭스 검증', () => {
  // ─── 허용 케이스 (7개) ──────────────────────────────────────────────────────
  describe('허용된 전이', () => {
    it('PLANNED → IN_PROGRESS: true', () => {
      expect(isValidTransition('PLANNED', 'IN_PROGRESS')).toBe(true);
    });

    it('PLANNED → ON_HOLD: true', () => {
      expect(isValidTransition('PLANNED', 'ON_HOLD')).toBe(true);
    });

    it('IN_PROGRESS → DONE: true', () => {
      expect(isValidTransition('IN_PROGRESS', 'DONE')).toBe(true);
    });

    it('IN_PROGRESS → ON_HOLD: true', () => {
      expect(isValidTransition('IN_PROGRESS', 'ON_HOLD')).toBe(true);
    });

    it('DONE → IN_PROGRESS: true', () => {
      expect(isValidTransition('DONE', 'IN_PROGRESS')).toBe(true);
    });

    it('ON_HOLD → PLANNED: true', () => {
      expect(isValidTransition('ON_HOLD', 'PLANNED')).toBe(true);
    });

    it('ON_HOLD → IN_PROGRESS: true', () => {
      expect(isValidTransition('ON_HOLD', 'IN_PROGRESS')).toBe(true);
    });
  });

  // ─── 불허 케이스 (9개) ──────────────────────────────────────────────────────
  describe('불허된 전이', () => {
    it('PLANNED → DONE: false', () => {
      expect(isValidTransition('PLANNED', 'DONE')).toBe(false);
    });

    it('PLANNED → PLANNED (자기 자신): false', () => {
      expect(isValidTransition('PLANNED', 'PLANNED')).toBe(false);
    });

    it('IN_PROGRESS → PLANNED: false', () => {
      expect(isValidTransition('IN_PROGRESS', 'PLANNED')).toBe(false);
    });

    it('IN_PROGRESS → IN_PROGRESS (자기 자신): false', () => {
      expect(isValidTransition('IN_PROGRESS', 'IN_PROGRESS')).toBe(false);
    });

    it('DONE → PLANNED: false', () => {
      expect(isValidTransition('DONE', 'PLANNED')).toBe(false);
    });

    it('DONE → ON_HOLD: false', () => {
      expect(isValidTransition('DONE', 'ON_HOLD')).toBe(false);
    });

    it('DONE → DONE (자기 자신): false', () => {
      expect(isValidTransition('DONE', 'DONE')).toBe(false);
    });

    it('ON_HOLD → DONE: false', () => {
      expect(isValidTransition('ON_HOLD', 'DONE')).toBe(false);
    });

    it('ON_HOLD → ON_HOLD (자기 자신): false', () => {
      expect(isValidTransition('ON_HOLD', 'ON_HOLD')).toBe(false);
    });
  });

  // ─── 전체 상태 전이 매트릭스 완전 검증 ─────────────────────────────────────
  describe('매트릭스 전체 케이스 (16개)', () => {
    const statuses = ['PLANNED', 'IN_PROGRESS', 'DONE', 'ON_HOLD'];
    const expectedResults = {
      'PLANNED-PLANNED': false,
      'PLANNED-IN_PROGRESS': true,
      'PLANNED-DONE': false,
      'PLANNED-ON_HOLD': true,
      'IN_PROGRESS-PLANNED': false,
      'IN_PROGRESS-IN_PROGRESS': false,
      'IN_PROGRESS-DONE': true,
      'IN_PROGRESS-ON_HOLD': true,
      'DONE-PLANNED': false,
      'DONE-IN_PROGRESS': true,
      'DONE-DONE': false,
      'DONE-ON_HOLD': false,
      'ON_HOLD-PLANNED': true,
      'ON_HOLD-IN_PROGRESS': true,
      'ON_HOLD-DONE': false,
      'ON_HOLD-ON_HOLD': false,
    };

    statuses.forEach((from) => {
      statuses.forEach((to) => {
        const key = `${from}-${to}`;
        const expected = expectedResults[key];
        it(`${from} → ${to}: ${expected}`, () => {
          expect(isValidTransition(from, to)).toBe(expected);
        });
      });
    });
  });
});
