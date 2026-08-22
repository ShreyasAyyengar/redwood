/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: command parsing and final audit are intentionally centralized */
/** biome-ignore-all lint/correctness/noUndeclaredVariables: this script runs on Bun and uses its runtime globals */
/** biome-ignore-all lint/performance/noAwaitInLoops: migration batches must run serially to preserve dependency order and limit load */
/** biome-ignore-all lint/style/noMagicNumbers: CLI bounds and preview sizes are local policy values */
/** biome-ignore-all lint/suspicious/noConsole: this is an operator-facing CLI and console output is its interface */

import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";
import {
  attributeImportSchema,
  classroomImportSchema,
  groupImportSchema,
  issueImportSchema,
  maintenanceImportSchema,
  taskImportSchema,
} from "../convex/migrations/schemas.ts";

const COLLECTIONS = ["attributes", "groups", "classrooms", "issues", "tasks", "maintenance"] as const;
const MAX_BATCH_SIZE = 1000;
const DUPLICATE_PREVIEW_SIZE = 5;
type Collection = (typeof COLLECTIONS)[number];
type JsonObject = Record<string, unknown>;

const FILE_NAMES: Record<Collection, string> = {
  attributes: "redwood-parallel.attributes.json",
  groups: "redwood-parallel.groups.json",
  classrooms: "redwood-parallel.classrooms.json",
  issues: "redwood-parallel.issues.json",
  tasks: "redwood-parallel.tasks.json",
  maintenance: "redwood-parallel.maintenance.json",
};

const FUNCTION_NAMES: Record<Collection, string> = {
  attributes: "migrations/mongoImport:importAttributes",
  groups: "migrations/mongoImport:importGroups",
  classrooms: "migrations/mongoImport:importClassrooms",
  issues: "migrations/mongoImport:importIssues",
  tasks: "migrations/mongoImport:importTasks",
  maintenance: "migrations/mongoImport:importMaintenance",
};

const preparedSchemas = {
  attributes: attributeImportSchema,
  groups: groupImportSchema,
  classrooms: classroomImportSchema,
  issues: issueImportSchema,
  tasks: taskImportSchema,
  maintenance: maintenanceImportSchema,
};

const countSchema = z.object({
  attributes: z.number(),
  groups: z.number(),
  classrooms: z.number(),
  issues: z.number(),
  tasks: z.number(),
  maintenance: z.number(),
});

const preflightSchema = z.object({
  mappings: z.number(),
  targetCounts: countSchema,
});

const importResultSchema = z.object({
  inserted: z.number(),
  skipped: z.number(),
});

const auditSchema = z.object({
  targetCounts: countSchema,
  mappingCounts: countSchema,
  unresolvedReferences: z.object({
    classroomAttributes: z.number(),
    issues: z.number(),
    tasks: z.number(),
    maintenance: z.number(),
  }),
  issueStatuses: z.object({ resolved: z.number(), unresolved: z.number() }),
  taskStatuses: z.object({ completed: z.number(), open: z.number() }),
  derivedFieldMismatches: z.object({
    issueFeed: z.number(),
    taskFeed: z.number(),
    lastMaintenance: z.number(),
  }),
});

type Options = {
  source?: string;
  execute: boolean;
  push: boolean;
  prod: boolean;
  deployment?: string;
  envFile?: string;
  allowNonEmpty: boolean;
  batchSize: number;
};

type PreparedData = {
  [K in Collection]: z.infer<(typeof preparedSchemas)[K]>[];
};

function usage() {
  return `Migrate Redwood's MongoDB JSON exports into Convex.

Usage:
  bun run migrate:mongo --source <directory> [options]

The command is a dry run unless --execute is provided.

Options:
  --source <directory>   Directory containing the six redwood-parallel.*.json files
  --execute              Write the prepared documents to Convex
  --push                 Push the current Convex functions/schema before execution
  --prod                 Use Convex Cloud production (requires --execute)
  --deployment <name>    Use a specific Convex Cloud deployment reference
  --env-file <path>      Select a deployment from an env file (use for self-hosted production)
  --batch-size <number>  Documents per mutation; defaults to 50
  --allow-non-empty      Permit an initial import into non-empty target tables
  --dry-run              Explicitly validate without writing (the default)
  --help                  Show this message

Examples:
  bun run migrate:mongo --source "/path/to/Redwood Data"
  bun run migrate:mongo --source "/path/to/Redwood Data" --execute --push
  bun run migrate:mongo --source "/path/to/Redwood Data" --execute --env-file apps/backend/.env.selfhosted.local
`;
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    execute: false,
    push: false,
    prod: false,
    allowNonEmpty: false,
    batchSize: 50,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--source") {
      index += 1;
      options.source = requireOptionValue(argv, index, "--source");
      continue;
    }
    if (argument === "--deployment") {
      index += 1;
      options.deployment = requireOptionValue(argv, index, "--deployment");
      continue;
    }
    if (argument === "--env-file") {
      index += 1;
      options.envFile = resolve(requireOptionValue(argv, index, "--env-file"));
      continue;
    }
    if (argument === "--batch-size") {
      index += 1;
      const value = Number(requireOptionValue(argv, index, "--batch-size"));
      if (!Number.isSafeInteger(value) || value < 1 || value > MAX_BATCH_SIZE) {
        throw new Error(`--batch-size must be an integer from 1 to ${MAX_BATCH_SIZE}`);
      }
      options.batchSize = value;
      continue;
    }
    if (argument === "--execute") options.execute = true;
    else if (argument === "--dry-run") options.execute = false;
    else if (argument === "--push") options.push = true;
    else if (argument === "--prod") options.prod = true;
    else if (argument === "--allow-non-empty") options.allowNonEmpty = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.source) throw new Error("--source is required");
  const deploymentSelectors = [options.prod, options.deployment !== undefined, options.envFile !== undefined].filter(Boolean);
  if (deploymentSelectors.length > 1) {
    throw new Error("Use only one of --prod, --deployment, or --env-file");
  }
  if (options.prod && !options.execute) throw new Error("--prod requires --execute");
  if (options.push && !options.execute) throw new Error("--push requires --execute");
  return options;
}

function requireOptionValue(argv: string[], index: number, option: string) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

function asObject(value: unknown, path: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path} must be an object`);
  return value as JsonObject;
}

function requiredString(value: unknown, path: string) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function normalizeMongoValue(value: unknown, path = "document"): unknown {
  if (Array.isArray(value)) return value.map((item, index) => normalizeMongoValue(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return value;

  const object = value as JsonObject;
  const keys = Object.keys(object);
  if (keys.length === 1 && keys[0] === "$date") {
    const isoDate = requiredString(object.$date, `${path}.$date`);
    if (!Number.isFinite(Date.parse(isoDate))) throw new Error(`${path}.$date is not a valid date: ${isoDate}`);
    return new Date(isoDate).toISOString();
  }

  return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, normalizeMongoValue(item, `${path}.${key}`)]));
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonObject).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sourceHash(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function parsePrepared<K extends Collection>(collection: K, value: JsonObject) {
  const row = { ...value, sourceHash: sourceHash(value) };
  return preparedSchemas[collection].parse(row) as z.infer<(typeof preparedSchemas)[K]>;
}

function prepareDocument(collection: Collection, rawValue: unknown, index: number) {
  const path = `${collection}[${index}]`;
  const normalized = asObject(normalizeMongoValue(rawValue, path), path);
  const legacyId = requiredString(normalized._id, `${path}._id`);
  const { _id: _sourceId, ...withoutId } = normalized;

  if (collection === "attributes") return parsePrepared("attributes", { ...withoutId, legacyId });
  if (collection === "groups") return parsePrepared("groups", { ...withoutId, legacyId });

  if (collection === "classrooms") {
    const legacyAttributeIds = z.array(z.string()).parse(normalized.attributes);
    const captioning = normalized.captioning === undefined ? undefined : asObject(normalized.captioning, `${path}.captioning`);
    const migratedCaptioning = captioning
      ? {
          isCaptioningThisQuarter: captioning.isCaptioningThisQuarter ?? captioning.isCaptioning,
          type: captioning.type,
          identifier: captioning.identifier,
        }
      : undefined;
    const { attributes: _attributes, captioning: _captioning, roomStatus: _roomStatus, ...classroom } = withoutId;
    return parsePrepared("classrooms", {
      ...classroom,
      legacyId,
      legacyAttributeIds,
      ...(migratedCaptioning && { captioning: migratedCaptioning }),
    });
  }

  const legacyClassroomId = requiredString(normalized.classroomId, `${path}.classroomId`);
  const { classroomId: _classroomId, ...withoutClassroomId } = withoutId;

  if (collection === "issues") {
    const issue = asObject(normalized.issue, `${path}.issue`);
    const resolution = normalized.resolution === undefined ? undefined : asObject(normalized.resolution, `${path}.resolution`);
    const migratedIssue = { ...issue, onHold: issue.onHold ?? false };
    return parsePrepared("issues", {
      ...withoutClassroomId,
      legacyId,
      legacyClassroomId,
      issue: migratedIssue,
      feedStatus: resolution ? "RESOLVED" : "UNRESOLVED",
      feedDate: resolution
        ? requiredString(resolution.resolvedAt, `${path}.resolution.resolvedAt`)
        : requiredString(issue.reportedAt, `${path}.issue.reportedAt`),
    });
  }

  if (collection === "tasks") {
    const task = asObject(normalized.task, `${path}.task`);
    const completion = normalized.completion === undefined ? undefined : asObject(normalized.completion, `${path}.completion`);
    return parsePrepared("tasks", {
      ...withoutClassroomId,
      legacyId,
      legacyClassroomId,
      feedStatus: completion ? "COMPLETED" : "OPEN",
      feedDate: completion
        ? requiredString(completion.completedAt, `${path}.completion.completedAt`)
        : requiredString(task.createdAt, `${path}.task.createdAt`),
    });
  }

  return parsePrepared("maintenance", { ...withoutClassroomId, legacyId, legacyClassroomId });
}

async function loadAndPrepare(sourceDirectory: string): Promise<{ data: PreparedData; replacementCharacters: Record<Collection, number> }> {
  const prepared: Partial<Record<Collection, unknown[]>> = {};
  const replacementCharacters = {} as Record<Collection, number>;

  for (const collection of COLLECTIONS) {
    const filePath = resolve(sourceDirectory, FILE_NAMES[collection]);
    const file = Bun.file(filePath);
    if (!(await file.exists())) throw new Error(`Missing export file: ${filePath}`);

    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch (error) {
      throw new Error(`Could not parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!Array.isArray(raw)) throw new Error(`${filePath} must contain a JSON array`);

    const duplicateIds = duplicateValues(
      raw.map((value, index) => requiredString(asObject(value, `${collection}[${index}]`)._id, `${collection}[${index}]._id`))
    );
    if (duplicateIds.length > 0) {
      throw new Error(`${collection} contains duplicate _id values: ${duplicateIds.slice(0, DUPLICATE_PREVIEW_SIZE).join(", ")}`);
    }

    replacementCharacters[collection] = raw.filter((value) => JSON.stringify(value).includes("�")).length;
    prepared[collection] = raw.map((value, index) => prepareDocument(collection, value, index));
  }

  const data = prepared as PreparedData;
  validateRelationships(data);
  return { data, replacementCharacters };
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function validateRelationships(data: PreparedData) {
  const attributeIds = new Set(data.attributes.map((attribute) => attribute.legacyId));
  const classroomIds = new Set(data.classrooms.map((classroom) => classroom.legacyId));
  const groupLabels = new Set(data.groups.map((group) => group.label));

  const missingAttributes = new Set(
    data.classrooms.flatMap((classroom) => classroom.legacyAttributeIds.filter((attributeId) => !attributeIds.has(attributeId)))
  );
  const missingGroups = new Set(data.classrooms.map((classroom) => classroom.groupKey).filter((groupKey) => !groupLabels.has(groupKey)));
  const missingClassrooms = new Set(
    [...data.issues, ...data.tasks, ...data.maintenance]
      .map((document) => document.legacyClassroomId)
      .filter((classroomId) => !classroomIds.has(classroomId))
  );
  const duplicateAttributeLabels = duplicateValues(data.attributes.map((attribute) => attribute.label));
  const duplicateGroupLabels = duplicateValues(data.groups.map((group) => group.label));
  const duplicateClassroomNames = duplicateValues(data.classrooms.map((classroom) => classroom.sourceRoomName));

  if (missingAttributes.size > 0) throw new Error(`Unresolved attribute IDs: ${[...missingAttributes].join(", ")}`);
  if (missingGroups.size > 0) throw new Error(`Classroom groupKey values without matching groups: ${[...missingGroups].join(", ")}`);
  if (missingClassrooms.size > 0) throw new Error(`Unresolved classroom IDs: ${[...missingClassrooms].join(", ")}`);
  if (duplicateAttributeLabels.length > 0) throw new Error(`Duplicate attribute labels: ${duplicateAttributeLabels.join(", ")}`);
  if (duplicateGroupLabels.length > 0) throw new Error(`Duplicate group labels: ${duplicateGroupLabels.join(", ")}`);
  if (duplicateClassroomNames.length > 0) throw new Error(`Duplicate classroom source names: ${duplicateClassroomNames.join(", ")}`);
}

function countsFor(data: PreparedData): Record<Collection, number> {
  return Object.fromEntries(COLLECTIONS.map((collection) => [collection, data[collection].length])) as Record<Collection, number>;
}

function statusCounts(data: PreparedData) {
  return {
    issues: {
      resolved: data.issues.filter((issue) => issue.feedStatus === "RESOLVED").length,
      unresolved: data.issues.filter((issue) => issue.feedStatus === "UNRESOLVED").length,
    },
    tasks: {
      completed: data.tasks.filter((task) => task.feedStatus === "COMPLETED").length,
      open: data.tasks.filter((task) => task.feedStatus === "OPEN").length,
    },
  };
}

function fingerprint(data: PreparedData) {
  return sourceHash(COLLECTIONS.flatMap((collection) => data[collection].map((document) => document.sourceHash)));
}

async function runConvex(functionName: string, args: JsonObject, options: Options, push = false): Promise<unknown> {
  const backendDirectory = resolve(import.meta.dir, "..");
  const command = ["bunx", "convex", "run"];
  if (options.prod) command.push("--prod");
  if (options.deployment) command.push("--deployment", options.deployment);
  if (options.envFile) command.push("--env-file", options.envFile);
  if (push) command.push("--push");
  command.push(functionName, JSON.stringify(args));

  const childProcess = Bun.spawn(command, {
    cwd: backendDirectory,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(childProcess.stdout).text(),
    new Response(childProcess.stderr).text(),
    childProcess.exited,
  ]);
  if (stderr.trim()) process.stderr.write(stderr);
  if (exitCode !== 0) throw new Error(`Convex command failed (${functionName}) with exit code ${exitCode}`);

  const output = stdout.trim();
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`Convex returned non-JSON output for ${functionName}:\n${output}`);
  }
}

async function executeMigration(data: PreparedData, options: Options) {
  const expectedCounts = countsFor(data);
  const target = options.envFile
    ? `the deployment selected by ${options.envFile}`
    : options.prod
      ? "Convex Cloud production"
      : (options.deployment ?? "the default Convex Cloud development deployment");
  console.log(`Connecting to ${target}...`);
  const preflight = preflightSchema.parse(await runConvex("migrations/mongoImport:preflight", {}, options, options.push));
  const initialTargetTotal = Object.values(preflight.targetCounts).reduce((sum, count) => sum + count, 0);

  if (initialTargetTotal !== preflight.mappings && !options.allowNonEmpty) {
    throw new Error(
      `The target contains ${initialTargetTotal} documents but ${preflight.mappings} Mongo ID mappings. ` +
        "Use an empty deployment or inspect the data, then pass --allow-non-empty deliberately."
    );
  }
  if (preflight.mappings > 0) console.log(`Resuming from ${preflight.mappings} existing Mongo ID mappings.`);

  for (const collection of COLLECTIONS) {
    const rows = data[collection];
    let inserted = 0;
    let skipped = 0;
    for (let offset = 0; offset < rows.length; offset += options.batchSize) {
      const batch = rows.slice(offset, offset + options.batchSize);
      const result = importResultSchema.parse(await runConvex(FUNCTION_NAMES[collection], { rows: batch }, options));
      inserted += result.inserted;
      skipped += result.skipped;
      const processed = Math.min(offset + batch.length, rows.length);
      console.log(`${collection}: ${processed}/${rows.length} (${inserted} inserted, ${skipped} already present)`);
    }
  }

  const audit = auditSchema.parse(await runConvex("migrations/mongoImport:audit", {}, options));
  const expectedStatuses = statusCounts(data);
  const failures: string[] = [];

  for (const collection of COLLECTIONS) {
    if (audit.mappingCounts[collection] !== expectedCounts[collection]) {
      failures.push(`${collection} mappings: expected ${expectedCounts[collection]}, received ${audit.mappingCounts[collection]}`);
    }
    if (!options.allowNonEmpty && audit.targetCounts[collection] !== expectedCounts[collection]) {
      failures.push(`${collection} documents: expected ${expectedCounts[collection]}, received ${audit.targetCounts[collection]}`);
    }
  }
  for (const [relationship, count] of Object.entries(audit.unresolvedReferences)) {
    if (count !== 0) failures.push(`${relationship} has ${count} unresolved references`);
  }
  for (const [field, count] of Object.entries(audit.derivedFieldMismatches)) {
    if (count !== 0) failures.push(`${field} has ${count} derived-field mismatches`);
  }
  if (
    audit.issueStatuses.resolved !== expectedStatuses.issues.resolved ||
    audit.issueStatuses.unresolved !== expectedStatuses.issues.unresolved
  ) {
    failures.push("issue status counts do not match the source export");
  }
  if (audit.taskStatuses.completed !== expectedStatuses.tasks.completed || audit.taskStatuses.open !== expectedStatuses.tasks.open) {
    failures.push("task status counts do not match the source export");
  }

  console.log("\nMigration audit:");
  console.table(
    COLLECTIONS.map((collection) => ({
      collection,
      source: expectedCounts[collection],
      mappings: audit.mappingCounts[collection],
      target: audit.targetCounts[collection],
    }))
  );
  if (failures.length > 0) throw new Error(`Migration completed but validation failed:\n- ${failures.join("\n- ")}`);
  console.log("Migration completed successfully; all counts and references passed validation.");
}

async function main() {
  const options = parseOptions(Bun.argv.slice(2));
  const sourceDirectory = resolve(options.source as string);
  console.log(`Reading MongoDB exports from ${sourceDirectory}...`);
  const { data, replacementCharacters } = await loadAndPrepare(sourceDirectory);
  const counts = countsFor(data);
  const statuses = statusCounts(data);

  console.log("\nValidated source data:");
  console.table(COLLECTIONS.map((collection) => ({ collection, documents: counts[collection] })));
  console.log(`Source fingerprint: ${fingerprint(data)}`);
  console.log(
    `Derived statuses: ${statuses.issues.resolved} resolved / ${statuses.issues.unresolved} unresolved issues; ` +
      `${statuses.tasks.completed} completed / ${statuses.tasks.open} open tasks.`
  );

  const replacementTotal = Object.values(replacementCharacters).reduce((sum, count) => sum + count, 0);
  if (replacementTotal > 0) {
    const affected = COLLECTIONS.filter((collection) => replacementCharacters[collection] > 0)
      .map((collection) => `${replacementCharacters[collection]} ${collection}`)
      .join(", ");
    console.warn(`Warning: ${replacementTotal} source documents contain the Unicode replacement character (�): ${affected}.`);
  }

  if (!options.execute) {
    console.log("\nDry run complete. No Convex deployment was contacted and no data was written.");
    console.log("Add --execute to perform the migration; add --push if the migration functions have not been deployed yet.");
    return;
  }

  await executeMigration(data, options);
}

main().catch((error) => {
  console.error(`\nMigration failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
