import * as chokidar from 'chokidar';
import * as path from 'path';
import { Runtime } from './runtime.js';
import { Server } from './server.js';

export function startDevServer() {
  process.env['DEV'] = '1';

  const server = new Server();
  server.startServer(8080);

  const runtime = new Runtime("site");

  const artifacts = runtime.build();
  server.files = artifacts?.outfiles;
  server.handlers = artifacts?.handlers;

  const updatedPaths = new Set<string>();
  let reloadFsTimer: NodeJS.Timeout;

  const pathUpdated = (filePath: string) => {
    updatedPaths.add(filePath.split(path.sep).join(path.posix.sep));
    clearTimeout(reloadFsTimer);
    reloadFsTimer = setTimeout(() => {
      console.log('Rebuilding site...');

      try {
        runtime.pathsUpdated(...updatedPaths);

        const artifacts = runtime.build();
        server.files = artifacts?.outfiles;
        server.handlers = artifacts?.handlers;

        updatedPaths.clear();
        server.events.emit('rebuild');
      }
      catch (e) {
        console.error(e);
      }

      console.log('Done.');
    }, 100);
  };

  (chokidar.watch('site', { ignoreInitial: true, cwd: process.cwd() })
    .on('add', pathUpdated)
    .on('change', pathUpdated)
    .on('unlink', pathUpdated));
}
