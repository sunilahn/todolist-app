import { describe, it, expect } from '@jest/globals';
import { hashPassword, comparePassword } from '../../../src/shared/utils/passwordUtils.js';

describe('passwordUtils', () => {
  describe('hashPassword()', () => {
    it('문자열을 반환하고 bcrypt 접두어($2a$12$ 또는 $2b$12$)를 포함한다', async () => {
      const hash = await hashPassword('myPassword123');

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('원본 비밀번호와 다른 값을 반환한다 (해싱됨)', async () => {
      const password = 'myPassword123';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
    });

    it('동일 비밀번호로 두 번 해싱해도 결과가 다르다 (salt 적용됨)', async () => {
      const password = 'myPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('빈 문자열이 아닌 값을 넣으면 항상 문자열을 반환한다', async () => {
      const inputs = ['a', '123', 'special!@#$%', 'longPasswordWith64chars1234567890123456789012345678901234567890'];

      for (const input of inputs) {
        const result = await hashPassword(input);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('comparePassword()', () => {
    it('올바른 비밀번호와 해시를 비교하면 true를 반환한다', async () => {
      const password = 'correctPassword';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('틀린 비밀번호와 해시를 비교하면 false를 반환한다', async () => {
      const hash = await hashPassword('correctPassword');
      const result = await comparePassword('wrongPassword', hash);

      expect(result).toBe(false);
    });
  });
});
