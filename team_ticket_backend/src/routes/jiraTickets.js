const express = require('express');
const JiraTicketsController = require('../controllers/jiraTickets');

const router = express.Router();

/**
 * @swagger
 * /api/jira-tickets:
 *   post:
 *     summary: Search Jira issues by date range, team assignees, and clients
 *     description: >
 *       Builds a dynamic JQL combining a date range with a predefined list of assignees and optional client filters.
 *       Credentials and client custom field are provided via environment variables.
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
 *                 format: date-time
 *                 description: Inclusive start date of the range (e.g., 2024-04-01)
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Exclusive end date of the range (e.g., 2024-05-01)
 *               clients:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                 description: Optional clients filter (array or comma-separated). Defaults to DEFAULT_CLIENTS env if omitted.
 *               dateField:
 *                 type: string
 *                 description: Date field to filter by (updated or created). Defaults to updated.
 *                 example: updated
 *               jql:
 *                 type: string
 *                 description: Additional JQL to AND with the constructed filters
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional override for the predefined list of assignee accountIds
 *             required:
 *               - startDate
 *               - endDate
 *     responses:
 *       200:
 *         description: Search results with constructed JQL and tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jql:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 assignees:
 *                   type: array
 *                   items:
 *                     type: string
 *                 clients:
 *                   type: array
 *                   items:
 *                     type: string
 *                 total:
 *                   type: integer
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       id:
 *                         type: string
 *                       summary:
 *                         type: string
 *                       status:
 *                         type: string
 *                       issueType:
 *                         type: string
 *                       project:
 *                         type: string
 *                       assignee:
 *                         type: object
 *                         properties:
 *                           accountId:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                       reporter:
 *                         type: object
 *                         properties:
 *                           accountId:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                       updated:
 *                         type: string
 *                         format: date-time
 */
router.post('/', JiraTicketsController.postSearch.bind(JiraTicketsController));

module.exports = router;
