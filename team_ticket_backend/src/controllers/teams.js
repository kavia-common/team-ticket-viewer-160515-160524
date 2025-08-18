const teamService = require('../services/teamService');
const ticketService = require('../services/ticketService');
const { getMonthRange } = require('../utils/dates');

class TeamsController {
  // PUBLIC_INTERFACE
  async listTeams(req, res, next) {
    /** Lists available teams for selection. */
    try {
      const teams = teamService.getTeams().map(t => ({ id: t.id, name: t.name }));
      return res.status(200).json({ teams });
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async getTeamMembers(req, res, next) {
    /** Returns team members inferred from tickets for the given month. */
    try {
      const { teamId } = req.params;
      const { month } = req.query;
      const team = teamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const range = getMonthRange(month);
      const members = await ticketService.getTeamMembers(team, range);
      return res.status(200).json({ teamId, month: range.month, members });
    } catch (err) {
      return next(err);
    }
  }

  // PUBLIC_INTERFACE
  async getTeamTickets(req, res, next) {
    /** Returns tickets for a team in a specified month, with optional filters. */
    try {
      const { teamId } = req.params;
      const { month, assignee, status, refresh } = req.query;
      const team = teamService.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const range = getMonthRange(month);
      const tickets = await ticketService.getTeamTickets(team, range, {
        assignee: assignee || undefined,
        status: status || undefined,
        refresh: String(refresh).toLowerCase() === 'true' || refresh === '1',
      });
      return res.status(200).json({ teamId, month: range.month, count: tickets.length, tickets });
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new TeamsController();
