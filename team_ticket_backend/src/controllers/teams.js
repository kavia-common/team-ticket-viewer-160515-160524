const teamService = require('../services/teamService');
const ticketService = require('../services/ticketService');
const jira = require('../services/jiraClient');
const dayjs = require('dayjs');
const { getMonthRange } = require('../utils/dates');

class TeamsController {
  // PUBLIC_INTERFACE
  async listTeams(req, res, next) {
    /** Lists available teams for selection. */
    try {
      const teams = teamService.getTeams().map(t => ({ id: t.id, name: t.name }));
      return res.status(200).json({ teams });
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async getTeamMembers(req, res, next) {
    /** Returns team members inferred from tickets for the given month. */
    try {
      const { teamId } = req.params;
      const { month } = req.query;
      const team = teamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const range = getMonthRange(month);
      const members = await ticketService.getTeamMembers(team, range);
      return res.status(200).json({ teamId, month: range.month, members });
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async getTeamTickets(req, res, next) {
    /** Returns tickets for a team in a specified month, with optional filters. */
    try {
      const { teamId } = req.params;
      const { month, assignee, status, refresh } = req.query;
      const team = teamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const range = getMonthRange(month);
      const tickets = await ticketService.getTeamTickets(team, range, {
        assignee: assignee || undefined,
        status: status || undefined,
        refresh: String(refresh).toLowerCase() === 'true' || refresh === '1',
      });
      return res.status(200).json({ teamId, month: range.month, count: tickets.length, tickets });
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async searchVymoIssues(req, res, next) {
    /**
     * Searches Jira issues for Team "Vymo" dashboard using a date range and optional JQL filters.
     *
     * Request body JSON:
     * - start: string (ISO or date) - inclusive start of range (required)
     * - end: string (ISO or date) - exclusive end of range (required)
     * - dateField: string - which date field to filter by ("updated" | "created"), defaults to "updated"
     * - jql: string - optional additional JQL to AND with the date filter
     * - project: string - optional Jira project key (e.g., "DEMO")
     * - assignee: string - optional assignee displayName or accountId
     * - status: string - optional Jira status name (e.g., "Done")
     *
     * Response: Array of { key, summary, self }
     */
    try {
      const {
        start,
        end,
        dateField,
        jql,
        project,
        assignee,
        status,
      } = req.body || {};

      // Validate inputs
      if (!start || !end) {
        return res.status(400).json({ error: 'Both "start" and "end" are required in request body.' });
      }
      const startDt = dayjs(start);
      const endDt = dayjs(end);
      if (!startDt.isValid() || !endDt.isValid()) {
        return res.status(400).json({ error: 'Invalid "start" or "end" date. Provide parseable date strings.' });
      }
      if (!endDt.isAfter(startDt)) {
        return res.status(400).json({ error: '"end" must be after "start".' });
      }

      const df = (typeof dateField === 'string' && ['updated', 'created'].includes(dateField.toLowerCase()))
        ? dateField.toLowerCase()
        : 'updated';

      // Build JQL parts
      const parts = [];
      // Date range filter (Jira expects YYYY/MM/DD)
      const startFmt = startDt.format('YYYY/MM/DD');
      const endFmt = endDt.format('YYYY/MM/DD');
      parts.push(`${df} >= "${startFmt}" AND ${df} < "${endFmt}"`);

      if (project && typeof project === 'string' && project.trim()) {
        parts.push(`project = ${project.trim()}`);
      }

      if (assignee && typeof assignee === 'string' && assignee.trim()) {
        const a = assignee.trim();
        if (/^[a-zA-Z0-9:\-]{10,}$/.test(a)) {
          parts.push(`assignee in ("${a.replace(/"/g, '\\"')}")`);
        } else {
          parts.push(`assignee = "${a.replace(/"/g, '\\"')}"`);
        }
      }

      if (status && typeof status === 'string' && status.trim()) {
        parts.push(`status = "${status.trim().replace(/"/g, '\\"')}"`);
      }

      if (jql && typeof jql === 'string' && jql.trim()) {
        parts.push(`(${jql.trim()})`);
      }

      const fullJql = parts.join(' AND ');

      // Fetch issues (paginate up to 500 results for safety)
      const pageSize = 100;
      let startAt = 0;
      let total = Infinity;
      const allIssues = [];

      while (startAt < total && startAt < 500) {
        const data = await jira.searchIssues({
          jql: fullJql,
          fields: ['summary'],
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

      const summaries = allIssues.map((issue) => ({
        key: issue.key,
        summary: issue && issue.fields ? issue.fields.summary : null,
        self: issue.self || null,
      }));

      return res.status(200).json(summaries);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new TeamsController();
