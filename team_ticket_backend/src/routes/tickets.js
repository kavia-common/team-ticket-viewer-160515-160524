const express = require('express');
const TicketsController = require('../controllers/tickets');

const router = express.Router();

/**
 * @swagger
 * /api/tickets/{issueKey}:
 *   get:
 *     summary: Get detailed information for a ticket
 *     description: Fetches detailed Jira issue information including changelog.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: issueKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Jira issue key (e.g., DEMO-123)
 *     responses:
 *       200:
 *         description: Detailed ticket data
 *       404:
 *         description: Ticket not found
 */
router.get('/:issueKey', TicketsController.getTicketDetails.bind(TicketsController));

module.exports = router;
