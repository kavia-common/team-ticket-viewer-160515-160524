const dayjs = require('dayjs');

// PUBLIC_INTERFACE
function getMonthRange(month) {
  /**
   * Parses a YYYY-MM string into a {start, end, month} range.
   * If not provided or invalid, defaults to the current month.
   */
  let base;
  if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    base = dayjs().year(y).month(m - 1).date(1);
  } else {
    base = dayjs().date(1);
  }
  const start = base.startOf('month').toISOString();
  const end = base.endOf('month').add(1, 'millisecond').toISOString();
  return { start, end, month: base.format('YYYY-MM') };
}

module.exports = {
  getMonthRange,
};
