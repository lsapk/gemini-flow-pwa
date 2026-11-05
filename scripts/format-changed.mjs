import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const changed = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMRT", "-z"],
  { encoding: "utf8" },
);
const added = execFileSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
);
const files = [...new Set((changed + added).split("\0"))].filter(
  (file) =>
    /\.(tsx?|mjs|js|json|css|md|html)$/.test(file) &&
    existsSync(file) &&
    !file.startsWith("supabase/") &&
    !file.endsWith("-report.json") &&
    !file.endsWith("npm-audit.json"),
);
if (files.length)
  execFileSync(
    process.execPath,
    ["node_modules/prettier/bin/prettier.cjs", "--write", ...files],
    { stdio: "inherit" },
  );
