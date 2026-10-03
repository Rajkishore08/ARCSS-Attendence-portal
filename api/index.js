module.exports = async (req, res) => {
  try {
    const appModule = require('../server/dist/app.js');
    const app = appModule.default || appModule;
    return app(req, res);
  } catch (error) {
    console.error('API Handler Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'API Handler Fatal Error',
        message: error && error.message ? error.message : String(error),
        stack: error && error.stack ? error.stack : undefined,
      });
    }
  }
};
