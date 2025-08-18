const jira = require('../services/jiraClient');

class TicketsController {
  // PUBLIC_INTERFACE
  async getTicketDetails(req, res, next) {
    /** Returns detailed ticket information for a given Jira issue key. */
    try {
      const { issueKey } = req.params;
      const issue = await jira.getIssue(issueKey, { expand: 'changelog,renderedFields' });
      if (!issue) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      return res.status(200).json(issue);
    } catch (err) {
      if (err && err.response && err.response.status === 404) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      return next(err);
    }
  }
}

module.exports = new TicketsController();
