
var push = require('./push')
  , pull = require('./pull')
  , sprintf = require('util').format
  , assert = require('assert')
  , path = require('path')
  , exec = require('child_process').exec
  , Batch = require('batch')
  , Email = require('email').Email
  , logger = require('component-consoler')

var l = console.log.bind(console);
var twd = path.resolve(__dirname, 'test/repo');
var tasks = new Batch().concurrency(1);
var cli = null;
var serv = null;

tasks
.push(cleanup)
.push(init)
.push(setup)
.push(ware)
.push(touch)
.push(add)
.push(commit)
.end(end);

function setup (done) {
  l("setup");
  cli = push(twd, 7777);
  serv = pull(7777);

  // ignore ENOENT
  cli.on('error', function (err) {
    if ('ENOENT' == err.code) {
      return false;
    }

    throw err;
  })
  .on('commit', function (c) {
    assert(c);
    assert(c.hash);
    assert(c.ware);
  });

  serv.on('message', function (msg) {
    assert(msg);
    exec('rm -rf .git', {cwd: twd}, function (err) {
      if (err) { throw err; }
      l("close");
      serv.close();
    });
  });

  done();
}

function ware (done) {
  cli.use(function (commit, next) {
    commit.ware = true;
    next();
  });

  cli.use(log());
  cli.use(email({
    to: 'joseph.werle@gmail.com',
    from: 'git@werle.io'
  }));

  function email (opts, fn) {
    opts = opts || {};
    fn = fn || function () {};
    return function (commit, next) {
      var msg = new Email({
        to: opts.to,
        from: opts.from || opts.to,
        subject: (
          opts.subject ||
          sprintf("git: (%s) %s", commit.hash, commit.message)
        ),
        body: JSON.stringify(commit)
      });

      msg.send(next);
    };
  }

  function log () {
    return function (commit, next) {
      logger.log('hash', commit.hash);
      logger.log('date', String(commit.date));
      logger.log('name', commit.author.name);
      logger.log('email', commit.author.email)
      logger.log('message', commit.message);
      next();
    };
  }

  done();
}

function init (done) {
  l("init");
  exec('git init', {cwd: twd}, done);
}

function touch (done) {
  l("touch");
  exec('touch file', {cwd: twd}, done);
}

function add (done) {
  l("add");
  exec('git add file', {cwd: twd}, done);
}

function commit (done) {
  l("commit");
  exec('git commit -m"file"', {cwd: twd}, done);
}

function cleanup (done) {
  l("cleanup");
  exec('rm -rf file', {cwd: twd}, done);
}

function end (err) {
  l("end");
  cleanup(function (e) {
    if (e) { throw e; }
    else if (err) { throw err; }
  });
}
