#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

async function text(path) {
  return readFile(path, "utf8");
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function frontmatter(source, label) {
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) {
    fail(`${label}: missing YAML frontmatter`);
    return {};
  }

  const values = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (field) values[field[1]] = field[2].trim();
  }
  return values;
}

async function markdownReferences(path, source) {
  const linkPattern = /\]\(([^)]+)\)/g;
  for (const match of source.matchAll(linkPattern)) {
    const target = match[1].split("#", 1)[0].trim();
    if (!target || /^(?:https?:|mailto:|#)/.test(target) || target.includes("<")) continue;
    const resolved = resolve(dirname(path), target);
    if (!(await exists(resolved))) {
      fail(`${relative(root, path)}: missing local reference ${target}`);
    }
  }
}

async function filesBelow(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...(await filesBelow(child)));
    else found.push(child);
  }
  return found;
}

const skillFamilies = ["entry", "pipeline", "teaching", "memory"];
const skills = new Map();

for (const family of skillFamilies) {
  const familyRoot = join(root, family);
  for (const entry of await readdir(familyRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(familyRoot, entry.name, "SKILL.md");
    if (!(await exists(skillPath))) continue;
    const source = await text(skillPath);
    const meta = frontmatter(source, relative(root, skillPath));
    if (meta.name !== entry.name) {
      fail(`${relative(root, skillPath)}: frontmatter name must be ${entry.name}`);
    }
    if (!meta.description) fail(`${relative(root, skillPath)}: description is required`);
    if (skills.has(entry.name)) fail(`duplicate skill name: ${entry.name}`);
    skills.set(entry.name, skillPath);
    await markdownReferences(skillPath, source);
  }
}

const manifestPath = join(root, "agents", "manifest.json");
const manifest = JSON.parse(await text(manifestPath));
const capabilityNames = new Set(Object.keys(manifest.capabilities ?? {}));
const expectedWeights = ["Light", "Standard", "Heavy"];
if (JSON.stringify(Object.keys(manifest.weights ?? {})) !== JSON.stringify(expectedWeights)) {
  fail("agents/manifest.json: weights must declare Light, Standard and Heavy in order");
}

const referencedRoles = new Set();
const codeAgents = [];
for (const [agentName, agent] of Object.entries(manifest.agents ?? {})) {
  const rolePath = join(root, "agents", agent.role ?? "");
  referencedRoles.add(resolve(rolePath));
  if (!(await exists(rolePath))) {
    fail(`agent ${agentName}: missing role ${agent.role}`);
    continue;
  }

  const source = await text(rolePath);
  const meta = frontmatter(source, relative(root, rolePath));
  if (meta.name !== agentName) {
    fail(`${relative(root, rolePath)}: frontmatter name must be ${agentName}`);
  }
  if (!meta.description) fail(`${relative(root, rolePath)}: description is required`);
  await markdownReferences(rolePath, source);

  for (const skill of agent.skills ?? []) {
    if (!skills.has(skill)) fail(`agent ${agentName}: unknown skill ${skill}`);
  }
  for (const capability of agent.capabilities ?? []) {
    if (!capabilityNames.has(capability)) {
      fail(`agent ${agentName}: unknown capability ${capability}`);
    }
  }

  const caps = new Set(agent.capabilities ?? []);
  if (agent.mutability === "read-only" && (caps.has("artifact-write") || caps.has("code-edit"))) {
    fail(`agent ${agentName}: read-only role has a write capability`);
  } else if (agent.mutability === "artifacts-only" && !caps.has("artifact-write")) {
    fail(`agent ${agentName}: artifacts-only role lacks artifact-write`);
  } else if (agent.mutability === "artifacts-only" && caps.has("code-edit")) {
    fail(`agent ${agentName}: artifacts-only role has code-edit`);
  } else if (agent.mutability === "code" && !caps.has("code-edit")) {
    fail(`agent ${agentName}: code role lacks code-edit`);
  } else if (!["read-only", "artifacts-only", "code"].includes(agent.mutability)) {
    fail(`agent ${agentName}: unknown mutability ${agent.mutability}`);
  }
  if (agent.mutability === "code") codeAgents.push(agentName);
}

if (JSON.stringify(codeAgents) !== JSON.stringify(["worker"])) {
  fail(`agents/manifest.json: worker must be the only code-mutable role; found ${codeAgents.join(", ") || "none"}`);
}

for (const [alias, target] of Object.entries(manifest.aliases ?? {})) {
  if (!manifest.agents?.[target]) fail(`alias ${alias}: unknown target ${target}`);
}

const roleFiles = (await filesBelow(join(root, "agents", "roles")))
  .filter((path) => path.endsWith(".md"));
for (const rolePath of roleFiles) {
  if (!referencedRoles.has(resolve(rolePath))) {
    fail(`${relative(root, rolePath)}: role is not referenced by the manifest`);
  }
}

const installer = await text(join(root, "install.sh"));
const installerList = installer.match(/SKILLS=\(([^)]+)\)/)?.[1]?.trim().split(/\s+/) ?? [];
const sourceSkills = [...skills.keys()].sort();
const installedSkills = [...installerList].sort();
if (JSON.stringify(sourceSkills) !== JSON.stringify(installedSkills)) {
  fail(`install.sh: SKILLS does not match source skills\n  source: ${sourceSkills.join(", ")}\n  installer: ${installedSkills.join(", ")}`);
}

if (failures.length) {
  console.error(`Skillify contract validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Skillify contracts valid: ${skills.size} skills, ${referencedRoles.size} roles, ${capabilityNames.size} capabilities.`);
