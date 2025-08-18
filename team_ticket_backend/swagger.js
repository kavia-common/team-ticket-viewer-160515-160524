const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Team Ticket Viewer API',
      version: '1.0.0',
      description: 'Express API integrating with Jira to view team tickets and members',
    },
    tags: [
      { name: 'Health', description: 'Service health monitoring' },
      { name: 'Teams', description: 'Team selection and member information' },
      { name: 'Tickets', description: 'Ticket retrieval and details' },
      { name: 'Admin', description: 'Administrative actions like cache refresh' }
    ]
  },
  apis: ['./src/routes/**/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
