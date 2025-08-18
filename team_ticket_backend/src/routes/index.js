const express = require('express');
const healthController = require('../controllers/health');
const healthService = require('../services/health');
const teamsRouter = require('./teams');
const ticketsRouter = require('./tickets');
const adminRouter = require('./admin');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health monitoring
 *   - name: Teams
 *     description: Team selection and member information
 *   - name: Tickets
 *     description: Ticket retrieval and details
 *   - name: Admin
 *     description: Administrative actions like cache refresh
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', (req, res, next) => {
  // If the client prefers HTML, render a minimal HTML landing page with links.
  const prefersHtml = req.accepts(['html', 'json']) === 'html';
  if (prefersHtml) {
    const status = healthService.getStatus();
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Team Ticket Viewer API</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; color: #333; }
    .links a { display: inline-block; margin-right: 1rem; color: #1976d2; text-decoration: none; }
    .links a:hover { text-decoration: underline; }
    pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow: auto; }
    h1 { margin-top: 0; }
  </style>
</head>
<body>
  <h1>Team Ticket Viewer API</h1>
  <div class="links">
    <a href="/docs">API Docs</a>
    <a href="/openapi.json">OpenAPI JSON</a>
    <a href="/health">Health (JSON)</a>
  </div>
  <h2>Health</h2>
  <pre>${JSON.stringify(status, null, 2)}</pre>
</body>
</html>`;
    res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
  } else {
    // Default to JSON for API clients
    return healthController.check.bind(healthController)(req, res, next);
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: JSON health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check (JSON)
 */
router.get('/health', healthController.check.bind(healthController));

// Mount feature routers
router.use('/api/teams', teamsRouter);
router.use('/api/tickets', ticketsRouter);
router.use('/api/admin', adminRouter);

module.exports = router;
