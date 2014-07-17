
/**
 * Module dependencies
 */

var pull = require('ppq/pull')

module.exports = function (addr) {
  if ('string' != typeof addr && 'number' != typeof addr) {
    throw new TypeError("expecting `addr' to be a string or number");
  }

  var serv = pull(addr);

  return serv;
};
