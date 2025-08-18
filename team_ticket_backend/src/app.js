require('dotenv').config();
const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

// Initialize express app
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.set('trust proxy', true);

// Helper to build dynamic swagger spec with runtime server URL
function getDynamicSpec(req) {
  const host = req.get('host');           // may or may not include port
  let protocol = req.protocol;            // http or https
  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
     (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  return {
    ...swaggerSpec,
    servers: [
      { url: `${protocol}://${fullHost}` }
    ],
  };
}

// Swagger UI
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const dynamicSpec = getDynamicSpec(req);
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Serve the OpenAPI spec JSON
app.get('/openapi.json', (req, res) => {
  const dynamicSpec = getDynamicSpec(req);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(dynamicSpec);
});

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/', routes);

// Error handling middleware
// PUBLIC_INTERFACE
app.use((err, req, res, next) => {
  /** Global error handler for the API. */
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  });
});

module.exports = app;
