import cron from 'node-cron';
import pool from '../../config/database.js';
import logger from '../../shared/utils/logger.js';
import { createNotification } from './notification.service.js';
import { getKSTTodayString } from '../../shared/utils/dateUtils.js';

export async function sendDueDateReminders() {
  const today = getKSTTodayString();

  // due_date가 내일인 할일 조회 (KST 기준 1일 후)
  const { rows: todos } = await pool.query(
    `SELECT todo_id, title, user_id, team_id
     FROM todos
     WHERE due_date = $1::date + INTERVAL '1 day'
       AND status NOT IN ('DONE')`,
    [today]
  );

  for (const todo of todos) {
    const targets = new Set();

    if (todo.user_id) {
      targets.add(todo.user_id);
    }

    if (todo.team_id) {
      const { rows: members } = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = $1`,
        [todo.team_id]
      );
      for (const m of members) {
        targets.add(m.user_id);
      }
    }

    for (const userId of targets) {
      await createNotification(
        userId,
        'DUE_DATE_REMINDER',
        `할일 "${todo.title}"의 마감일이 내일입니다.`,
        todo.todo_id
      );
    }
  }

  logger.info(`[scheduler] DUE_DATE_REMINDER ${todos.length}건 발송 완료`);
}

// 매일 KST 09:00 (UTC 00:00) 실행
export function startScheduler() {
  cron.schedule('0 0 * * *', async () => {
    try {
      await sendDueDateReminders();
    } catch (err) {
      logger.error('[scheduler] DUE_DATE_REMINDER 오류:', err);
    }
  });
  logger.info('[scheduler] DUE_DATE_REMINDER 스케줄러 시작');
}
