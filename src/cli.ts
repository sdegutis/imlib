#!/usr/bin/env node

import * as fs from 'fs';
import { startDevServer } from './dev-server';
import { generateFiles } from './file-generator';
import { processSite } from './ssp';

const config = {
  siteDir: "site",
  processor: processSite,
  jsxContentBrowser: fs.readFileSync(__dirname + '/../src/jsx-dom.ts'),
  jsxContentSsg: fs.readFileSync(__dirname + '/../src/jsx-strings.ts'),
};

const fns: Record<string, () => void> = {
  dev: () => startDevServer(config),
  generate: () => generateFiles(config),
};

const cmd = process.argv[2] ?? '';
const fn = fns[cmd] ?? showHelp;
fn();

function showHelp() {
  console.log("Usage: imlib <dev | generate>");
}