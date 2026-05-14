const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Returns a Date object representing the start of today in KST (00:00:00.000 KST),
 * expressed as a UTC Date so that arithmetic remains correct.
 *
 * @returns {Date}
 */
export function getKSTToday() {
  const nowUtcMs = Date.now();
  const kstMs = nowUtcMs + KST_OFFSET_MS;
  // Truncate to midnight KST then convert back to UTC
  const kstMidnightMs = Math.floor(kstMs / 86_400_000) * 86_400_000;
  return new Date(kstMidnightMs - KST_OFFSET_MS);
}

/**
 * Returns today's date as a 'YYYY-MM-DD' string in KST.
 *
 * @returns {string}
 */
export function getKSTTodayString() {
  const kstDate = new Date(Date.now() + KST_OFFSET_MS);
  return kstDate.toISOString().slice(0, 10);
}

/**
 * Returns the Monday–Sunday week range for the current week in KST.
 *
 * @returns {{ start: string, end: string }}
 */
export function getKSTWeekRange() {
  const kstDate = new Date(Date.now() + KST_OFFSET_MS);
  // getUTCDay() on a KST-shifted Date gives the KST day-of-week (0 = Sunday)
  const dayOfWeek = kstDate.getUTCDay(); // 0 Sun … 6 Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayKst = new Date(kstDate);
  mondayKst.setUTCDate(kstDate.getUTCDate() + diffToMonday);

  const sundayKst = new Date(mondayKst);
  sundayKst.setUTCDate(mondayKst.getUTCDate() + 6);

  const fmt = (d) => d.toISOString().slice(0, 10);

  return {
    start: fmt(mondayKst),
    end: fmt(sundayKst),
  };
}
