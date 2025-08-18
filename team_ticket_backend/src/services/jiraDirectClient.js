const axios = require('axios');

/**
 * Lightweight Jira client that authenticates via Authorization header.
 * Uses environment variables:
 * - JIRA_BASE_URL
 * - JIRA_AUTH_HEADER (e.g., "Basic base64(email:apitoken)")
 *
 * This client is separate from the existing jiraClient.js which uses axios auth.
 */
let cachedInstance = null;

function buildMissingEnvMessage(missing) {
  const list = missing.join(', ');
  const err = new Error(
    `Jira client is not configured. Missing required environment variable(s): ${list}`
  );
  err.status = 503;
  return err;
}

function getInstance() {
  if (cachedInstance) return cachedInstance;

  const required = ['JIRA_BASE_URL', 'JIRA_AUTH_HEADER'];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length) {
    throw buildMissingEnvMessage(missing);
  }

  const baseUrl = String(process.env.JIRA_BASE_URL).replace(/\/*$/, '');

  cachedInstance = axios.create({
    baseURL: `${baseUrl}/rest/api/3`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: process.env.JIRA_AUTH_HEADER,
    },
    timeout: 15000,
  });

  return cachedInstance;
}

// PUBLIC_INTERFACE
async function searchIssues({ jql, fields = [], expand = '', maxResults = 100, startAt = 0 }) {
  /** Posts to Jira Search API using Authorization header from env. */
  if (typeof jql !== 'string' || !jql.trim()) {
    const err = new Error('JQL is required');
    err.status = 400;
    throw err;
  }
  const instance = getInstance();
  const body = {
    jql,
    maxResults,
    startAt,
    ...(Array.isArray(fields) && fields.length ? { fields } : {}),
    ...(expand ? { expand } : {}),
  };
  const resp = await instance.post('/search', body);
  return resp.data;
}

module.exports = {
  searchIssues,
};
