const axios = require('axios');

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

const JIRA_EMAIL = requiredEnv('JIRA_EMAIL');
const JIRA_API_TOKEN = requiredEnv('JIRA_API_TOKEN');
const JIRA_BASE_URL = requiredEnv('JIRA_BASE_URL').replace(/\/+$/, '');

const instance = axios.create({
  baseURL: `${JIRA_BASE_URL}/rest/api/3`,
  auth: {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN,
  },
  headers: {
    Accept: 'application/json',
  },
  timeout: 15000,
});

// PUBLIC_INTERFACE
async function searchIssues({ jql, fields = [], expand = '', maxResults = 100, startAt = 0 }) {
  /** Calls Jira search API with the given JQL, handling pagination by caller. */
  const params = {
    jql,
    fields: fields.length ? fields.join(',') : undefined,
    expand: expand || undefined,
    maxResults,
    startAt,
  };
  const resp = await instance.get('/search', { params });
  return resp.data;
}

// PUBLIC_INTERFACE
async function getIssue(issueKey, { expand = '' } = {}) {
  /** Retrieves a single Jira issue by key. */
  const params = { expand: expand || undefined };
  const resp = await instance.get(`/issue/${encodeURIComponent(issueKey)}`, { params });
  return resp.data;
}

module.exports = {
  searchIssues,
  getIssue,
};
