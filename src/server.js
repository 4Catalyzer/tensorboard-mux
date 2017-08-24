/* eslint-disable no-console */

import childProcess from 'child_process';
import 'colors';
import fs from 'fs';
import http from 'http';
import httpProxy from 'http-proxy';
import fetch from 'node-fetch';
import path from 'path';
import pathToRegexp from 'path-to-regexp';
import url from 'url';
import yargs from 'yargs';

const PATTERN_REGEXP = pathToRegexp('/:logPath(.*)/-/(.*)?');
const DASHLESS_PATTERN_REGEXP = pathToRegexp('/:logPath(.*)');

const { argv } = yargs
  .option('logdir', {
    required: true,
  })
  .option('host', {
    default: '0.0.0.0',
  })
  .option('port', {
    default: 6006,
    number: true,
  })
  .help()
  .version();

const LOG_DIR_PREFIX = argv.logdir;

class InvalidPathError {}

function safeJoin(basePath, ...paths) {
  const parts = [basePath];

  for (let filename of paths) {
    if (filename) {
      filename = path.posix.normalize(filename);
    }

    if (
      (path.sep !== '/' && filename.includes(path.sep)) ||
      path.isAbsolute(filename) ||
      filename === '..' ||
      filename.startsWith('../')
    ) {
      throw new InvalidPathError();
    }

    parts.push(filename);
  }

  return path.posix.join(...parts);
}

const tensorBoards = Object.create(null);
let lastPort = argv.port;

function logWithPrefix(prefix, data) {
  data
    .toString()
    .trim()
    .split('\n')
    .forEach((line) => { console.log(prefix, line); });
}

async function createTensorBoard(logDir) {
  const port = ++lastPort;

  const logPath = path.relative(LOG_DIR_PREFIX, logDir);
  console.log(
    'spawning TensorBoard for',
    logPath.blue.bold,
    'on',
    `:${port}`.green.bold,
  );

  const child = childProcess.spawn('tensorboard', [
    '--logdir', logDir,
    '--port', port,
  ]);

  const logPrefix = `[${logPath}]`;
  child.stdout.on('data', logWithPrefix.bind(null, logPrefix.white.bold));
  child.stderr.on('data', logWithPrefix.bind(null, logPrefix.red.bold));

  // Wait for the TensorBoard server to be ready.
  while (true) { // eslint-disable-line no-constant-condition
    try {
      const res = await fetch(`http://localhost:${port}`); // eslint-disable-line no-await-in-loop
      if (res.ok) {
        break;
      }
    } catch (e) {} // eslint-disable-line no-empty
  }

  return { port, child };
}

async function ensureTensorBoard(logDir) {
  if (!tensorBoards[logDir]) {
    tensorBoards[logDir] = createTensorBoard(logDir);
  }

  return tensorBoards[logDir];
}

const proxy = httpProxy.createProxyServer({});

const server = http.createServer(async (req, res) => {
  const match = (
    PATTERN_REGEXP.exec(req.url) ||
    DASHLESS_PATTERN_REGEXP.exec(req.url)
  );
  if (!match) {
    res.writeHead(404);
    res.end();
    return;
  }

  const [logPath, childPathname] = match.slice(1);
  if (childPathname == null) {
    res.writeHead(302, { Location: `/${logPath}/-/` });
    res.end();
    return;
  }

  let logDir;
  try {
    logDir = safeJoin(LOG_DIR_PREFIX, logPath);
  } catch (e) {
    if (e instanceof InvalidPathError) {
      res.writeHead(404);
      res.end();
      return;
    }

    throw e;
  }

  if (!fs.existsSync(logDir)) {
    res.writeHead(404);
    res.end();
    return;
  }

  const { port } = await ensureTensorBoard(logDir);

  proxy.web(req, res, {
    target: url.resolve(`http://localhost:${port}`, childPathname),
    ignorePath: true,
  });
});

server.listen(argv.port, argv.host, () => {
  console.log('listening on', `${argv.host}:${argv.port}`.green.bold);
});
