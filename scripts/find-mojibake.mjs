import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TARGETS = ['src', 'scripts', 'supabase'];
const TEXT_FILE_RE = /\.(ts|tsx|js|jsx|json|md|sql|css|html)$/i;
const IGNORED_FILES = new Set([
  'src/utils/textEncoding.ts',
  'scripts/find-mojibake.mjs',
  'supabase/scripts/audit_text_encoding.sql',
]);
const SUSPICIOUS_PATTERNS = [
  /Ã[\p{L}\p{M}]/u,
  /Ä[\p{L}\p{M}]/u,
  /Æ[\p{L}\p{M}]/u,
  /á»[\p{L}\p{M}]/u,
  /áº[\p{L}\p{M}]/u,
  /â€[\p{L}\p{M}]/u,
  /Â(?:\s|·|°|º|¼|»|«|:|;|,|\.)/u,
  /�/u,
];

const targets = process.argv.slice(2);
const roots = targets.length > 0 ? targets : DEFAULT_TARGETS;
const findings = [];

const shouldFlag = (line) => SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(line));

const walk = (entry) => {
  if (!fs.existsSync(entry)) return;

  const stat = fs.statSync(entry);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(entry)) {
      walk(path.join(entry, child));
    }
    return;
  }

  if (!TEXT_FILE_RE.test(entry)) return;
  const normalized = entry.split(path.sep).join('/');
  if (IGNORED_FILES.has(normalized)) return;

  const text = fs.readFileSync(entry, 'utf8');
  text.split(/\r?\n/).forEach((line, index) => {
    if (shouldFlag(line)) {
      findings.push(`${entry}:${index + 1}: ${line.trim()}`);
    }
  });
};

roots.forEach(walk);

if (findings.length === 0) {
  console.log('No suspicious mojibake sequences found.');
  process.exit(0);
}

console.log(findings.join('\n'));
process.exit(1);
