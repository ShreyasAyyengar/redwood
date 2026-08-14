/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as core_attributes_schemas from "../core/attributes/schemas.js";
import type * as core_attributes_service from "../core/attributes/service.js";
import type * as core_attributes_table from "../core/attributes/table.js";
import type * as core_classrooms_schemas from "../core/classrooms/schemas.js";
import type * as core_classrooms_service from "../core/classrooms/service.js";
import type * as core_classrooms_table from "../core/classrooms/table.js";
import type * as core_csv_schemas from "../core/csv/schemas.js";
import type * as core_csv_service from "../core/csv/service.js";
import type * as core_csv_table from "../core/csv/table.js";
import type * as core_feedback from "../core/feedback.js";
import type * as core_groups_schemas from "../core/groups/schemas.js";
import type * as core_groups_service from "../core/groups/service.js";
import type * as core_groups_table from "../core/groups/table.js";
import type * as core_issues_schemas from "../core/issues/schemas.js";
import type * as core_issues_service from "../core/issues/service.js";
import type * as core_issues_table from "../core/issues/table.js";
import type * as core_maintenance_schemas from "../core/maintenance/schemas.js";
import type * as core_maintenance_service from "../core/maintenance/service.js";
import type * as core_maintenance_table from "../core/maintenance/table.js";
import type * as core_tasks_schemas from "../core/tasks/schemas.js";
import type * as core_tasks_service from "../core/tasks/service.js";
import type * as core_tasks_table from "../core/tasks/table.js";
import type * as core_users_schemas from "../core/users/schemas.js";
import type * as core_users_service from "../core/users/service.js";
import type * as core_users_table from "../core/users/table.js";
import type * as http from "../http.js";
import type * as lib_csv from "../lib/csv.js";
import type * as lib_procedures from "../lib/procedures.js";
import type * as lib_time from "../lib/time.js";
import type * as migrations_mongoImport from "../migrations/mongoImport.js";
import type * as migrations_schemas from "../migrations/schemas.js";
import type * as migrations_table from "../migrations/table.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "core/attributes/schemas": typeof core_attributes_schemas;
  "core/attributes/service": typeof core_attributes_service;
  "core/attributes/table": typeof core_attributes_table;
  "core/classrooms/schemas": typeof core_classrooms_schemas;
  "core/classrooms/service": typeof core_classrooms_service;
  "core/classrooms/table": typeof core_classrooms_table;
  "core/csv/schemas": typeof core_csv_schemas;
  "core/csv/service": typeof core_csv_service;
  "core/csv/table": typeof core_csv_table;
  "core/feedback": typeof core_feedback;
  "core/groups/schemas": typeof core_groups_schemas;
  "core/groups/service": typeof core_groups_service;
  "core/groups/table": typeof core_groups_table;
  "core/issues/schemas": typeof core_issues_schemas;
  "core/issues/service": typeof core_issues_service;
  "core/issues/table": typeof core_issues_table;
  "core/maintenance/schemas": typeof core_maintenance_schemas;
  "core/maintenance/service": typeof core_maintenance_service;
  "core/maintenance/table": typeof core_maintenance_table;
  "core/tasks/schemas": typeof core_tasks_schemas;
  "core/tasks/service": typeof core_tasks_service;
  "core/tasks/table": typeof core_tasks_table;
  "core/users/schemas": typeof core_users_schemas;
  "core/users/service": typeof core_users_service;
  "core/users/table": typeof core_users_table;
  http: typeof http;
  "lib/csv": typeof lib_csv;
  "lib/procedures": typeof lib_procedures;
  "lib/time": typeof lib_time;
  "migrations/mongoImport": typeof migrations_mongoImport;
  "migrations/schemas": typeof migrations_schemas;
  "migrations/table": typeof migrations_table;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
