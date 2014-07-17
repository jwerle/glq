
/**
 * Module dependencies
 */

var log = require('git-log')
  , watch = require('watch').watchTree
  , unwatch = require('watch').unwatchTree
  , push = require('ppq/push')
  , fs = require('fs')
  , path = require('path')
  , sprintf = require('util').format

var exists = fs.existsSync;
var basename = path.basename;
var resolve = path.resolve;

/**
 * Push commit changes at `path'
 * to `addr'
 *
 * @api public
 * @param {String} path
 * @param {String|Number} addr
 */

module.exports = function (path, addr) {
  if ('string' != typeof path) {
    throw new TypeError("expecting `path' to be a string");
  } else if ('string' != typeof addr && 'number' != typeof addr) {
    throw new TypeError("expecting `addr' to be a string or number");
  } else if (!exists(path)) {
    throw new Error(sprintf("ENOENT: `%s' doesn't exists", path));
  }

  if ('.git' != basename(path)) {
    path = resolve(path, '.git');
    if (!exists(path)) {
      throw new Error("ENOENT: Unable to find `.git' directory");
    }
  }

  var c = push(addr);
  var seen = [];
  var emit = false;
  var sending = false;
  var timer = null;
  var timeout = 150;

  watch(path, function (file, curr, prev) {
    var name = null;
    if (true == sending) { return; }
    if (file) {
      name = basename(
        'object' == typeof file ? Object.keys(file)[0] : file
      );
    }

    if (/COMMIT_EDITMSG/.test(name)) {
      emit = true;
    }

    if (!emit) { return; }

    if (timer) { clearTimeout(timer); }

    timer = setTimeout(function () {
      var e = null;
      if (!exists(path)) {
        e = new Error(sprintf("`%s' no longer exists", path));
        e.code = 'ENOENT'
        c.emit('error', e);
        unwatch(path);
        return;
      }
      sending = true;
      log(path)
      .on('error', function (err) {
      })
      .on('data', function (d){
        if (-1 == seen.indexOf(d.hash)) {
          c.emit('commit', d);
          c.emit('data', d);
          seen.push(d.hash);
          c.send(d);
        }
      })
      .on('end', function () {
        emit = false;
        sending = false;
      });
    }, 10);
  });

  return c;
};
