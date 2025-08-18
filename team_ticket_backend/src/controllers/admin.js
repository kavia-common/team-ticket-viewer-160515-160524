const { clearCache } = require('../services/cache');

class AdminController {
  // PUBLIC_INTERFACE
  async refreshCache(req, res, next) {
    /** Clears the in-memory cache used for Jira API responses. */
    try {
      clearCache();
      return res.status(200).json({ status: 'ok', message: 'Cache cleared' });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AdminController();
