glq
===

Git log message queue

## install

```sh
$ npm install glq
```

## usage

### module

Push updates commits to a host. Initial push will send all
parsed commits. It will push commits in realtime as they are created
in the desired repo. It uses [watch](https://github.com/mikeal/watch)
and [git-log](https://github.com/juliangruber/git-log) internally.

*client:*

```js
var push = require('glq/push')

push('/path/to/repo', '127.0.0.1:7777')
.on('commit', function (commit) {
  console.log("commit(%s) %j", commit.hash, commit);
});
```

*server*:

```js
var pull = require('glq/pull');

pull(7777)
.on('commit', function (commit) {
  console.log("commit(%s) %j", commit.hash, commit);
});
```

#### plugins

`push` and `pull` both return objects that expose a `use()` function
that allows you to "use" a function as middleware when data is receievd.
We can write a simple plugin that emails the author when a commit is
made and another that logs output nicely to the terminal using
[component-consoler](https://github.com/component/console.js)

```js
var push = require('glq/push');
var Email = require('email').Email;
var logger = require('component-consoler');

push('/path/to/repo', '127.0.0.1:7777')
.use(email({from: 'git@kinkajou.com'}))
.use(log());

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
```

### command line

```sh
usage: glq [-hV]
   or: glq push <addr>
   or: glq push <repo> <addr>
   or: glq pull <addr>
```

Push current working directory (`pwd`) commits in realtime to `addr`:

```sh
$ glq push 127.0.0.1:7777
```

Push `/path/to/repo` commits in realtime to `addr`:

```sh
$ glq push /path/to/repo 127.0.0.1:7777
```

Pull commits in realtime from a given `addr`:

```sh
$ glq pull 127.0.0.1:7777
```

## license

MIT

