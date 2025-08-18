const dayjs = require('dayjs');
const jira = require('../services/jiraDirectClient');

class JiraTicketsController {
  // PUBLIC_INTERFACE
  async search(req, res, next) {
    /**
     * Receives start_date, end_date, and an optional clients array from the frontend,
     * builds a JQL query, calls Jira REST API using Authorization header from env,
     * and returns the Jira response payload.
     *
     * Request body JSON:
     * - start_date: string (ISO/date) Inclusive start of range (required)
     * - end_date: string (ISO/date)   Exclusive end of range (required)
     * - clients: string[] (optional)  Interpreted as Jira project keys -> "project in (...)"
     * - startAt: number (optional)    Jira pagination start
     * - maxResults: number (optional) Jira page size
     * - fields: string[] (optional)   Jira fields to return
     */
    try {
      const {
        start_date,
        end_date,
        clients,
        startAt,
        maxResults,
        fields,
      } = req.body || {};

      if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Both "start_date" and "end_date" are required.' });
      }

      const startDt = dayjs(start_date);
      const endDt = dayjs(end_date);
      if (!startDt.isValid() || !endDt.isValid()) {
        return res.status(400).json({ error: 'Invalid "start_date" or "end_date". Provide parseable date strings.' });
      }
      if (!endDt.isAfter(startDt)) {
        return res.status(400).json({ error: '"end_date" must be after "start_date".' });
      }

      // Use Jira date format YYYY/MM/DD
      const startFmt = startDt.format('YYYY/MM/DD');
      const endFmt = endDt.format('YYYY/MM/DD');

      const parts = [
        `updated >= "${startFmt}"`,
        `updated < "${endFmt}"`,
      ];

      // Clients -> treat as project keys by default
      if (Array.isArray(clients) && clients.length) {
        const clean = clients.map((c) => String(c).trim()).filter(Boolean);
        if (clean.length) {
          const quoted = clean.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(', ');
          parts.push(`project in (${quoted})`);
        }
      }

      const jql = parts.join(' AND ');

      const data = await jira.searchIssues({
        jql,
        fields: Array.isArray(fields) && fields.length
          ? fields
          : ['summary', 'status', 'assignee', 'updated', 'reporter', 'project', 'issuetype'],
        startAt: Number.isFinite(startAt) ? startAt : 0,
        maxResults: Number.isFinite(maxResults) ? maxResults : 100,
      });

      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new JiraTicketsController();
