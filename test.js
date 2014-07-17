
var push = require('./push')
  , pull = require('./pull')
  , assert = require('assert')
  , path = require('path')
  , exec = require('child_process').exec
  , Batch = require('batch')

var l = console.log.bind(console);
var twd = path.resolve(__dirname, 'test/repo');
var tasks = new Batch().concurrency(1);
var cli = null;
var serv = null;

tasks
.push(cleanup)
.push(init)
.push(setup)
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
  });

  serv.on('message', function (msg) {
    console.log(msg)
    //assert(msg);
    exec('rm -rf .git', {cwd: twd}, function (err) {
      if (err) { throw err; }
      l("close");
      serv.close();
    });
  });

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
  l("comit");
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
