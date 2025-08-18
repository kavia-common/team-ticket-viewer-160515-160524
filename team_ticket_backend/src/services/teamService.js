const teams = require('../data/teams.json');

// PUBLIC_INTERFACE
function getTeams() {
  /** Returns the list of configured teams. */
  return teams;
}

// PUBLIC_INTERFACE
function getTeamById(id) {
  /** Returns a team by its identifier. */
  return teams.find(t => t.id === id);
}

module.exports = {
  getTeams,
  getTeamById,
};
