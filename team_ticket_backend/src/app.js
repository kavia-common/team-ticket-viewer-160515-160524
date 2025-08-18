require('dotenv').config();
const cors = require('cors');
const express = require('express');
const jiraTicketsRouter = require('./routes/jiraTickets');

// Initialize express app
const app = express();

// CORS and security basics
app.use(cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.set('trust proxy', true);

// Parse JSON request body
app.use(express.json());

// Mount only the Jira tickets endpoint
app.use('/api', jiraTicketsRouter);

/**
 * Error handling middleware
 * Attempts to surface meaningful HTTP status codes and safe error messages,
 * especially for Jira configuration/authentication issues.
 */
// PUBLIC_INTERFACE
app.use((err, req, res, next) => {
  /** Global error handler for the API. */
  // Log full error for server-side troubleshooting
  if (err && err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  // Prefer explicit status on the error (e.g., from jiraClient) or axios response status
  const axiosStatus = err && err.response && err.response.status;
  const status = Number(err && (err.status || err.statusCode || axiosStatus)) || 500;

  // Safely determine message
  let message = 'Internal Server Error';
  if (status === 503 && err && err.message) {
    message = err.message; // e.g., missing Jira env variables
  } else if (axiosStatus) {
    if (axiosStatus === 401 || axiosStatus === 403) {
      message = 'Jira authentication failed. Please verify JIRA_EMAIL and JIRA_API_TOKEN.';
    } else if (axiosStatus === 429) {
      message = 'Jira rate limit exceeded. Please try again later.';
    } else if (axiosStatus >= 400 && axiosStatus < 500) {
      message = err.response && err.response.data && (err.response.data.errorMessages || err.response.data.message)
        ? Array.isArray(err.response.data.errorMessages)
          ? err.response.data.errorMessages.join('; ')
          : String(err.response.data.message)
        : 'Bad Request to Jira API';
    }
  } else if (err && err.message && status < 500) {
    // For non-axios, client-level errors, pass through message
    message = err.message;
  }

  // Include optional, safe details for debugging in non-production
  const details = {};
  if (axiosStatus) {
    details.jiraStatus = axiosStatus;
  }
  if (process.env.NODE_ENV !== 'production') {
    if (err && err.code) details.code = err.code;
    if (err && err.name) details.name = err.name;
  }

  res.status(status).json({
    status: 'error',
    message,
    ...(Object.keys(details).length ? { details } : {}),
  });
});

module.exports = app;
