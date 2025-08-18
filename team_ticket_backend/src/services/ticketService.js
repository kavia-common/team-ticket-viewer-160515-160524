const dayjs = require('dayjs');
const jira = require('./jiraClient');
const { cache } = require('./cache');

// Normalize basic fields returned from Jira issue for frontend
function mapIssue(issue) {
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

// Build a JQL string combining team base JQL with month range and optional filters
function buildJql(team, range, filters) {
  const parts = [];

  // Optional project scoping:
  // - If team.jqlBase is provided (non-empty), use it as-is (backwards compatibility)
  // - Else if team.project is provided and not "all", scope by project
  // - Else no project filter (fetch across all accessible projects)
  if (team) {
    if (typeof team.jqlBase === 'string' && team.jqlBase.trim()) {
      parts.push(`(${team.jqlBase.trim()})`);
    } else if (typeof team.project === 'string') {
      const project = team.project.trim();
      if (project && project.toLowerCase() !== 'all') {
        parts.push(`(project = ${project})`);
      }
    }
  }

  // Consider issues updated in the specified month
  const start = dayjs(range.start).format('YYYY/MM/DD');
  const end = dayjs(range.end).format('YYYY/MM/DD');
  parts.push(`updated >= "${start}" AND updated < "${end}"`);

  if (filters.assignee) {
    // Allow either accountId or displayName; prefer accountId if it looks like one
    if (/^[a-zA-Z0-9:\-]{10,}$/.test(filters.assignee)) {
      parts.push(`assignee in ("${filters.assignee.replace(/"/g, '\\"')}")`);
    } else {
      parts.push(`assignee = "${filters.assignee.replace(/"/g, '\\"')}"`);
    }
  }

  if (filters.status) {
    parts.push(`status = "${filters.status.replace(/"/g, '\\"')}"`);
  }

  return parts.join(' AND ');
}

// Fetch all pages for a given JQL up to a reasonable cap to avoid excessive loads
async function fetchAllIssues(jql, fields, expand) {
  const pageSize = 100;
  let startAt = 0;
  let total = Infinity;
  const issues = [];

  while (startAt < total && startAt < 1000) {
    const data = await jira.searchIssues({ jql, fields, expand, maxResults: pageSize, startAt });
    total = data.total || 0;
    const items = data.issues || [];
    issues.push(...items);
    startAt += items.length;
    if (items.length === 0) break;
  }
  return issues;
}

// PUBLIC_INTERFACE
async function getTeamTickets(team, range, { assignee, status, refresh = false } = {}) {
  /** Returns tickets for a given team and month. Applies optional filters and caching. */
  const filters = { assignee, status };
  const cacheKey = `tickets:${team.id}:${range.month}:${assignee || ''}:${status || ''}`;
  if (!refresh) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  const fields = [
    'summary',
    'issuetype',
    'status',
    'assignee',
    'reporter',
    'updated',
    'project',
  ];

  const jql = buildJql(team, range, filters);
  const issues = await fetchAllIssues(jql, fields, '');
  const tickets = issues.map(mapIssue);

  cache.set(cacheKey, tickets);
  return tickets;
}

// PUBLIC_INTERFACE
async function getTeamMembers(team, range) {
  /** Derives a list of unique team members based on assignees in the team's tickets for the month. */
  const tickets = await getTeamTickets(team, range, { refresh: false });
  const map = new Map();
  for (const t of tickets) {
    if (t.assignee && t.assignee.accountId) {
      map.set(t.assignee.accountId, {
        accountId: t.assignee.accountId,
        displayName: t.assignee.displayName,
      });
    }
  }
  return Array.from(map.values());
}

module.exports = {
  getTeamTickets,
  getTeamMembers,
};
