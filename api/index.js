const app = require('../server/dist/app.js').default || require('../server/dist/app.js');

module.exports = (req, res) => {
  return app(req, res);
};
