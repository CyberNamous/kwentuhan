import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const found = { config: [], knowledge: [], conversations: [], scenarios: [] };
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.generated', '.wrangler', 'public', 'tests', 'test-results', 'playwright-report'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full);
    else if (item.name.endsWith('.json')) {
      const data = JSON.parse(await readFile(full, 'utf8'));
      const relative = path.relative(root, full).split(path.sep).join('/');
      if (data.persona && data.language_rules && data.behavior_guidelines) found.config.push(relative);
      if (Array.isArray(data.entries) && data.entries.every(x => x.id && x.topic)) found.knowledge.push(relative);
      if (Array.isArray(data.conversations) && data.conversations.every(x => x.id && Array.isArray(x.messages))) found.conversations.push(relative);
      if (Array.isArray(data.scenarios) && data.scenarios.every(x => x.id && x.recommended_approach)) found.scenarios.push(relative);
    }
  }
}
await walk(root);
if (found.config.length !== 1 || !found.knowledge.length || !found.conversations.length || !found.scenarios.length) {
  throw new Error('Expected exactly one behavior configuration and at least one knowledge, conversation, and scenario JSON source. Inspect uploaded dataset schemas.');
}
let output = '// Generated import manifest only. Original JSON files remain the single source of truth.\n';
for (const [kind, files] of Object.entries(found)) {
  files.sort();
  files.forEach((f, i) => { output += `import ${kind}${i} from ${JSON.stringify('../' + f)} with { type: 'json' };\n`; });
  const expr = kind === 'config' ? 'config0' : `[${files.map((_, i) => `${kind}${i}.${kind === 'knowledge' ? 'entries' : kind}`).join(', ')}].flat()`;
  output += `export const ${kind} = ${expr};\n`;
}
output += `export const sources = ${JSON.stringify(found)};\n`;
await mkdir(path.join(root, '.generated'), { recursive: true });
await writeFile(path.join(root, '.generated/dataset.mjs'), output);
console.log('Dataset discovered by schema (no copies):', found);
