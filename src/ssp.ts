import { File } from "./file.js";
import { SiteProcessor } from "./runtime";

export const postProcessors: Record<string, PostProcessor> = {
  html: hoistHtml,
  json: JSON.stringify,
};

export function hoistHtml(jsx: string) {
  const hoisted = new Set<string>();
  return (jsx
    .replace(/<script .+?><\/script>|<link .+?>/g, (s, s2) => {
      hoisted.add(s);
      return '';
    })
    .replace(/<\/head>/, [...hoisted, '</head>'].join('')));
}

export type PostProcessor = (s: any) => string;

export function postProcess(f: Outfile): Outfile {
  const ext = f.path.match(/\.(.+)$/)![1];
  if (ext && ext in postProcessors) {
    const fn = postProcessors[ext] ?? (s => s);
    f.content = fn(f.content);
  }
  return f;
}


export interface Outfile {
  path: string;
  content: string | Buffer;
}

export type ProcFn = (file: File, captureGroups: Record<string, string>) => Outfile | Outfile[];
export type Processor = [RegExp, ProcFn];

export const processors: Processor[] = [];

export const skip: ProcFn = () => [];
export const asIs: ProcFn = (f) => f;

// TODO: move this check into processSite somehow
if (!process.env['DEV']) {
  processors.push([/^\/admin\//, skip]);
}

processors.push([/\.md$/, skip]);
processors.push([/_.*\.js$/, skip]);

processors.push([/\/.*(?<slug>\[.+\]).*\.(?<ext>.+)\.js$/, (file, groups) => {
  const array = file.module!.require().default as [string, string][];
  return array.map(([slug, content]) => postProcess({
    path: file.path.slice(0, -3).replace(groups["slug"]!, slug),
    content,
  }));
}]);

processors.push([/\.(?<ext>.+)\.js$/, (file, groups) => postProcess({
  path: file.path.slice(0, -3),
  content: file.module!.require().default,
})]);

processors.push([/./, asIs]);

export const processSite: SiteProcessor = (files) => {
  const outfiles = new Map<string, Buffer | string>();

  for (const file of files) {
    const proc = processors.find(([r]) => file.path.match(r))!;
    const [r, fn] = proc;

    const match = file.path.match(r)!;
    const processed = fn(file, match.groups!);
    const normalized = Array.isArray(processed) ? processed : [processed];

    for (const { path, content } of normalized) {
      outfiles.set(path, content);
    }
  }

  return outfiles;
};
