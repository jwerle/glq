
/**
 * Module dependencies
 */

var pull = require('ppq/pull')
  , Ware = require('ware')

module.exports = function (addr) {
  if ('string' != typeof addr && 'number' != typeof addr) {
    throw new TypeError("expecting `addr' to be a string or number");
  }

  var serv = pull(addr);
  var ware = Ware();

  serv.use = function (fn) {
    ware.use(fn);
    return this;
  };

  serv.on('message', function (msg) {
    ware.run(msg, function (err, commit) {
      serv.emit('commit', commit);
    })
  });

  return serv;
};
