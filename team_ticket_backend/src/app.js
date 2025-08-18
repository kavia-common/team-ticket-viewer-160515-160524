require('dotenv').config();
const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

// Initialize express app
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.set('trust proxy', true);

// Helper to build dynamic swagger spec with runtime server URL
function getDynamicSpec(req) {
  const host = req.get('host');           // may or may not include port
  let protocol = req.protocol;            // http or https
  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
     (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  return {
    ...swaggerSpec,
    servers: [
      { url: `${protocol}://${fullHost}` }
    ],
  };
}

// Swagger UI
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const dynamicSpec = getDynamicSpec(req);
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Serve the OpenAPI spec JSON
app.get('/openapi.json', (req, res) => {
  const dynamicSpec = getDynamicSpec(req);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(dynamicSpec);
});

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/', routes);

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

  // Safely determine message:
  // - For 503 (service unavailable) likely due to missing Jira env: show explicit message
  // - For axios errors, try to surface a concise message without leaking secrets
  let message = 'Internal Server Error';
  if (status === 503 && err && err.message) {
    message = err.message; // e.g., "Jira client is not configured. Missing required environment variable(s): ..."
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
