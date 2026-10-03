import app from './app';

const handler = function (req: any, res: any) {
  return app(req, res);
};

module.exports = handler;
module.exports.default = handler;
