const dayjs = require('dayjs');
const jira = require('../services/jiraClient');

class JiraTicketsController {
  // PUBLIC_INTERFACE
  async search(req, res, next) {
    /**
     * Searches Jira issues using a date range and optional client filters (no assignee filtering).
     *
     * Request body JSON:
     * - startDate: string (ISO or date) - inclusive start of range (required)
     * - endDate: string (ISO or date) - exclusive end of range (required)
     * - clients: string[] - optional list of client identifiers (mapped as project names/keys for JQL)
     *
     * Behavior:
     * - Builds a JQL query using updated date range and optional project filter derived from clients
     * - Uses environment variables (JIRA_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL) for Jira auth
     * - Calls Jira Search API with fields: key and collects up to 2000 issues
     *
     * Returns:
     * - 200 JSON: { issues: [ { id, key, self, fields?, ... } ] }
     * - 4xx/5xx JSON with error details via global error handler
     */
    try {
      const { startDate, endDate, clients } = req.body || {};

      // Validate input
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Both "startDate" and "endDate" are required in body.' });
      }
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ error: 'Invalid "startDate" or "endDate". Provide parseable date strings.' });
      }
      if (!end.isAfter(start)) {
        return res.status(400).json({ error: '"endDate" must be after "startDate".' });
      }

      // Build JQL
      const parts = [];
      const startFmt = start.format('YYYY/MM/DD');
      const endFmt = end.format('YYYY/MM/DD');
      parts.push(`updated >= "${startFmt}" AND updated < "${endFmt}"`);

      if (Array.isArray(clients) && clients.length > 0) {
        const values = clients
          .map((c) => (typeof c === 'string' ? c.trim() : ''))
          .filter(Boolean)
          .map((c) => `"${c.replace(/"/g, '\\"')}"`);
        if (values.length > 0) {
          parts.push(`project in (${values.join(', ')})`);
        }
      }

      const jql = parts.join(' AND ');

      // Fetch up to 2000 issues with pagination
      const pageSize = 100;
      let startAt = 0;
      let total = Infinity;
      const allIssues = [];

      while (startAt < total && startAt < 2000) {
        const data = await jira.searchIssues({
          jql,
          fields: ['key'],
          expand: '',
          maxResults: pageSize,
          startAt,
        });
        total = data.total || 0;
        const items = Array.isArray(data.issues) ? data.issues : [];
        allIssues.push(...items);
        startAt += items.length;
        if (items.length === 0) break;
      }

      return res.status(200).json({ issues: allIssues });
    } catch (err) {
      // Surface through global error handler
      return next(err);
    }
  }
}

module.exports = new JiraTicketsController();
