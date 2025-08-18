const express = require('express');
const healthController = require('../controllers/health');
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
router.get('/', healthController.check.bind(healthController));

// Mount feature routers
router.use('/api/teams', teamsRouter);
router.use('/api/tickets', ticketsRouter);
router.use('/api/admin', adminRouter);

module.exports = router;
