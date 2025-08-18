const axios = require('axios');

/**
 * Lazily create and cache the Jira axios instance.
 * This avoids throwing during server startup when env vars are absent,
 * allowing health and non-Jira routes to function.
 */
let cachedInstance = null;

function buildMissingEnvMessage(missing) {
  const list = missing.join(', ');
  const err = new Error(
    `Jira client is not configured. Missing required environment variable(s): ${list}`
  );
  err.status = 503; // Surface a more appropriate HTTP status to callers
  return err;
}

function getInstance() {
  if (cachedInstance) return cachedInstance;

  const required = ['JIRA_EMAIL', 'JIRA_API_TOKEN', 'JIRA_BASE_URL'];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length) {
    // Do not throw at import time; only when a Jira method is actually used.
    throw buildMissingEnvMessage(missing);
  }

  const baseUrl = String(process.env.JIRA_BASE_URL).replace(/\/+$/, '');

  cachedInstance = axios.create({
    baseURL: `${baseUrl}/rest/api/3`,
    auth: {
      username: process.env.JIRA_EMAIL,
      password: process.env.JIRA_API_TOKEN,
    },
    headers: {
      Accept: 'application/json',
    },
    timeout: 15000,
  });

  return cachedInstance;
}

// PUBLIC_INTERFACE
async function searchIssues({ jql, fields = [], expand = '', maxResults = 100, startAt = 0 }) {
  /** Calls Jira search API with the given JQL, handling pagination by caller. */
  const instance = getInstance();
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
  const instance = getInstance();
  const params = { expand: expand || undefined };
  const resp = await instance.get(`/issue/${encodeURIComponent(issueKey)}`, { params });
  return resp.data;
}

module.exports = {
  searchIssues,
  getIssue,
};
