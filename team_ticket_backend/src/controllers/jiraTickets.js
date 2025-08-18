const dayjs = require('dayjs');
const jira = require('../services/jiraClient');

/**
 * Controller responsible for handling Jira ticket searches using a date range,
 * a predefined list of assignees, and optional client filtering.
 *
 * Requires environment variables:
 * - JIRA_BASE_URL
 * - JIRA_EMAIL
 * - JIRA_API_TOKEN
 * - JIRA_CLIENT_FIELD (e.g., 'Client' or 'cf[12345]')
 * - DEFAULT_CLIENTS (comma-separated list, optional)
 */
class JiraTicketsController {
  /**
   * Replace the following ASSIGNEES array with your team's Jira accountIds.
   * IMPORTANT:
   * - On Jira Cloud, assignee filtering by accountId usually requires accountId("...") wrapper in JQL.
   *   However, for compatibility with existing code in this repo, we use string "in" matching.
   *   If needed, adjust to: assignee in (accountId("id1"), accountId("id2"), ...)
   *
   * Example accountIds from sample JQL (insert your real ones):
   *   - 61f4c6d4aab1230067890abc
   *   - 5f1234567890abcd1234efgh
   *   - 557058:abcd-ef01-2345-6789abcdef01
   */
  static ASSIGNEES = [
    // TODO: Insert your team's Jira accountIds here
    // '61f4c6d4aab1230067890abc',
    // '5f1234567890abcd1234efgh',
    // '557058:abcd-ef01-2345-6789abcdef01',
  ];

  /**
   * Parse "clients" input which may be an array or a comma-separated string.
   * If not provided, use DEFAULT_CLIENTS from env (comma-separated).
   */
  static parseClients(input) {
    if (Array.isArray(input)) {
      return input.map((c) => String(c).trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
      return input.split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (process.env.DEFAULT_CLIENTS) {
      return String(process.env.DEFAULT_CLIENTS)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return [];
  }

  /**
   * Build JQL with:
   * - dateField within [startDate, endDate) formatted as YYYY/MM/DD
   * - assignee in (predefined accountIds)
   * - optional client field filter using JIRA_CLIENT_FIELD and provided/default clients
   * - optional extraJql to AND with
   */
  static buildJql({ startDate, endDate, dateField = 'updated', assignees = [], clients = [], extraJql = '' }) {
    const parts = [];

    // Dates
    const startFmt = dayjs(startDate).format('YYYY/MM/DD');
    const endFmt = dayjs(endDate).format('YYYY/MM/DD');
    parts.push(`${dateField} >= "${startFmt}" AND ${dateField} < "${endFmt}"`);

    // Assignees
    if (assignees.length) {
      // To switch to accountId() form, use:
      // const assigneeExpr = assignees.map((a) => `accountId("${a.replace(/"/g, '\\"')}")`).join(', ');
      // parts.push(`assignee in (${assigneeExpr})`);
      const asn = assignees.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(', ');
      parts.push(`assignee in (${asn})`);
    }

    // Clients
    const clientField = (process.env.JIRA_CLIENT_FIELD || '').trim();
    if (clientField && clients.length) {
      const cs = clients.map((c) => `"${String(c).replace(/"/g, '\\"')}"`).join(', ');
      // JQL allows using field display name or custom field id (e.g., cf[12345])
      parts.push(`"${clientField}" in (${cs})`);
    }

    // Extra JQL if provided
    if (extraJql && typeof extraJql === 'string' && extraJql.trim()) {
      parts.push(`(${extraJql.trim()})`);
    }

    return parts.join(' AND ');
  }

  static mapIssue(issue) {
    const fields = issue.fields || {};
    const assignee = fields.assignee || {};
    const status = (fields.status && fields.status.name) || undefined;

    return {
      key: issue.key,
      id: issue.id,
      summary: fields.summary,
      status,
      issueType: fields.issuetype ? fields.issuetype.name : undefined,
      project: fields.project ? fields.project.key : undefined,
      assignee: assignee
        ? {
            accountId: assignee.accountId || null,
            displayName: assignee.displayName || null,
          }
        : null,
      reporter: fields.reporter
        ? {
            accountId: fields.reporter.accountId || null,
            displayName: fields.reporter.displayName || null,
          }
        : null,
      updated: fields.updated,
    };
  }

  static async fetchAllIssues(jql, fields, expand) {
    const pageSize = 100;
    let startAt = 0;
    let total = Infinity;
    const issues = [];

    while (startAt < total && startAt < 1000) {
      const data = await jira.searchIssues({ jql, fields, expand, maxResults: pageSize, startAt });
      total = data.total || 0;
      const items = Array.isArray(data.issues) ? data.issues : [];
      issues.push(...items);
      startAt += items.length;
      if (items.length === 0) break;
    }
    return issues;
  }

  // PUBLIC_INTERFACE
  async postSearch(req, res, next) {
    /**
     * Execute a Jira search by date range, team assignees, and optional clients.
     *
     * Request Body:
     * - startDate: string | date - inclusive start date (required)
     * - endDate: string | date - exclusive end date (required)
     * - clients: string[] | string (comma-separated) - optional, defaults to DEFAULT_CLIENTS env
     * - dateField: "updated" | "created" - optional, defaults to "updated"
     * - jql: string - optional, extra JQL to AND with
     * - assignees: string[] - optional override for the predefined ASSIGNEES
     *
     * Response:
     * {
     *   jql: string,
     *   startDate: string,
     *   endDate: string,
     *   assignees: string[],
     *   clients: string[],
     *   total: number,
     *   issues: Array<{
     *     key, id, summary, status, issueType, project,
     *     assignee: { accountId, displayName } | null,
     *     reporter: { accountId, displayName } | null,
     *     updated
     *   }>
     * }
     */
    try {
      const {
        startDate,
        endDate,
        clients: rawClients,
        dateField,
        jql: extraJql,
        assignees: overrideAssignees,
      } = req.body || {};

      // Validate dates
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      if (!startDate || !endDate || !start.isValid() || !end.isValid()) {
        return res.status(400).json({ error: 'Both "startDate" and "endDate" are required and must be valid dates.' });
      }
      if (!end.isAfter(start)) {
        return res.status(400).json({ error: '"endDate" must be after "startDate".' });
      }

      const df = typeof dateField === 'string' && ['updated', 'created'].includes(dateField.toLowerCase())
        ? dateField.toLowerCase()
        : 'updated';

      const clients = JiraTicketsController.parseClients(rawClients);
      const assignees = Array.isArray(overrideAssignees) && overrideAssignees.length
        ? overrideAssignees
        : JiraTicketsController.ASSIGNEES;

      const jql = JiraTicketsController.buildJql({
        startDate,
        endDate,
        dateField: df,
        assignees,
        clients,
        extraJql,
      });

      const fields = [
        'summary',
        'issuetype',
        'status',
        'assignee',
        'reporter',
        'updated',
        'project',
      ];

      const rawIssues = await JiraTicketsController.fetchAllIssues(jql, fields, '');
      const issues = rawIssues.map(JiraTicketsController.mapIssue);

      return res.status(200).json({
        jql,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        assignees,
        clients,
        total: issues.length,
        issues,
      });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new JiraTicketsController();
