import * as fs from 'fs';
import * as path from 'path/posix';
import { Runtime } from '../runtime.js';
import { processSite } from '../ssg.js';

export function generateFiles() {
  const runtime = new Runtime({
    siteDir: "site",
    processor: processSite,
    jsxContentBrowser: fs.readFileSync(require.resolve("@imlib/jsx-dom")),
    jsxContentSsg: fs.readFileSync(require.resolve("@imlib/jsx-strings")),
  });

  const out = runtime.build()!;

  const madeDirs = new Set<string>();
  const mkdirIfNeeded = (dir: string) => {
    if (madeDirs.has(dir)) return;
    madeDirs.add(dir);
    console.log('mkdir', dir);
    fs.mkdirSync(dir);
  };

  for (const [filepath, content] of out) {
    const newFilepath = path.join('docs', filepath);
    const parts = newFilepath.split(path.sep);
    for (let i = 1; i < parts.length; i++) {
      const dir = path.join(...parts.slice(0, i));
      mkdirIfNeeded(dir);
    }

    console.log('writefile', newFilepath)
    fs.writeFileSync(newFilepath, content);
  }
}
