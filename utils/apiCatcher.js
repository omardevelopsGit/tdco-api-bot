const publicEventEmitter = require('./multiEventEmitter.js');

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((e) => {
      publicEventEmitter.emit('api-error', e);
      next(e);
    });
  };
};
