const express = require('express');
const JiraTicketsController = require('../controllers/jiraTickets');

const router = express.Router();

/**
 * @swagger
 * /api/jira-tickets:
 *   post:
 *     summary: Search Jira tickets by date range and clients (no assignee filtering)
 *     description: |
 *       Executes a Jira search using the provided start and end dates, and optional client list
 *       (mapped as Jira projects), returning the raw issues array from Jira. Authentication uses
 *       JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_BASE_URL env variables.
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Inclusive start date of the range (e.g., 2024-04-01)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Exclusive end date of the range (e.g., 2024-05-01)
 *               clients:
 *                 type: array
 *                 description: Optional list of client identifiers; used as Jira projects in JQL
 *                 items:
 *                   type: string
 *             required:
 *               - startDate
 *               - endDate
 *     responses:
 *       200:
 *         description: Raw issues array from Jira Search API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid input
 *       503:
 *         description: Jira client not configured (missing env vars)
 */
router.post('/jira-tickets', JiraTicketsController.search.bind(JiraTicketsController));

module.exports = router;
