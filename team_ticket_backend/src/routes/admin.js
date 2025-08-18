const express = require('express');
const AdminController = require('../controllers/admin');

const router = express.Router();

/**
 * @swagger
 * /api/admin/cache/refresh:
 *   post:
 *     summary: Clear in-memory cache
 *     description: Clears the backend server in-memory cache for Jira data to force fresh retrieval on next requests.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Cache cleared
 */
router.post('/cache/refresh', AdminController.refreshCache.bind(AdminController));

module.exports = router;
