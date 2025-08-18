const express = require('express');
const JiraTicketsController = require('../controllers/jiraTickets');

const router = express.Router();

/**
 * @swagger
 * /api/jira-tickets/search:
 *   post:
 *     summary: Search Jira issues by date range and optional list of clients
 *     description: |
 *       Receives start_date, end_date, and an optional clients array to construct a JQL and calls the Jira REST API.
 *       Uses Authorization header from environment variables (JIRA_AUTH_HEADER) and base URL from JIRA_BASE_URL.
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Inclusive start date of the range (e.g., 2024-04-01)
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: Exclusive end date of the range (e.g., 2024-05-01)
 *               clients:
 *                 type: array
 *                 description: Optional list of Jira project keys to filter by (interpreted as project in (...))
 *                 items:
 *                   type: string
 *               startAt:
 *                 type: integer
 *                 description: Optional pagination start
 *               maxResults:
 *                 type: integer
 *                 description: Optional page size
 *               fields:
 *                 type: array
 *                 description: Optional list of fields to include in the Jira response
 *                 items:
 *                   type: string
 *             required:
 *               - start_date
 *               - end_date
 *     responses:
 *       200:
 *         description: Jira search API response payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/search', JiraTicketsController.search.bind(JiraTicketsController));

module.exports = router;
