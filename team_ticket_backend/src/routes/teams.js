const express = require('express');
const TeamsController = require('../controllers/teams');

const router = express.Router();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: List available teams for selection
 *     description: Returns a list of configured teams that the frontend can present for selection.
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   description: Array of teams
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Team identifier
 *                         example: alpha
 *                       name:
 *                         type: string
 *                         description: Human-friendly team name
 *                         example: Alpha Team
 */
router.get('/', TeamsController.listTeams.bind(TeamsController));

/**
 * @swagger
 * /api/teams/{teamId}/members:
 *   get:
 *     summary: Get team members for a given month
 *     description: Returns inferred team members (assignees) who worked on tickets for the selected team in the specified month.
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The team identifier
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *           pattern: "^[0-9]{4}-[0-9]{2}$"
 *           example: "2024-04"
 *         description: Month filter in YYYY-MM format. Defaults to the current month.
 *     responses:
 *       200:
 *         description: List of team members with minimal details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teamId:
 *                   type: string
 *                 month:
 *                   type: string
 *                   description: Month in YYYY-MM
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       accountId:
 *                         type: string
 *                       displayName:
 *                         type: string
 *       404:
 *         description: Team not found
 */
router.get('/:teamId/members', TeamsController.getTeamMembers.bind(TeamsController));

/**
 * @swagger
 * /api/teams/{teamId}/tickets:
 *   get:
 *     summary: Get tickets for a team in a selected month
 *     description: Retrieves Jira tickets worked on in the specified month for the given team, with optional filters.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team identifier
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *           example: "2024-04"
 *         description: Month in YYYY-MM format. Defaults to current month.
 *       - in: query
 *         name: assignee
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by assignee display name (exact match) or accountId
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by Jira status name (e.g., Done, In Progress)
 *       - in: query
 *         name: refresh
 *         required: false
 *         schema:
 *           type: boolean
 *         description: If true, bypass cache and refresh data
 *     responses:
 *       200:
 *         description: Tickets for the specified criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teamId:
 *                   type: string
 *                 month:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 tickets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                       summary:
 *                         type: string
 *                       status:
 *                         type: string
 *                       assignee:
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
router.get('/:teamId/tickets', TeamsController.getTeamTickets.bind(TeamsController));

module.exports = router;
