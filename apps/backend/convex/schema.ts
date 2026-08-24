import { defineSchema } from "convex/server";
import { attributeTable } from "./core/attributes/table.ts";
import { classroomTable } from "./core/classrooms/table.ts";
import { csvRecordTable } from "./core/csv/table.ts";
import { groupTable } from "./core/groups/table.ts";
import { hotlineCategoryTable, hotlineTable } from "./core/hotline/table.ts";
import { issueTable } from "./core/issues/table.ts";
import { maintenanceEntryTable } from "./core/maintenance/table.ts";
import { taskTable, taskTemplateTable } from "./core/tasks/table.ts";
import { redwoodUserTable } from "./core/users/table.ts";
import { mongoMigrationIdTable } from "./migrations/table.ts";

export default defineSchema({
  classrooms: classroomTable,
  csvRecords: csvRecordTable,
  issues: issueTable,
  tasks: taskTable,
  taskTemplates: taskTemplateTable,
  maintenance: maintenanceEntryTable,
  attributes: attributeTable,
  redwoodUsers: redwoodUserTable,
  groups: groupTable,
  mongoMigrationIds: mongoMigrationIdTable,
  hotline: hotlineTable,
  hotlineCategories: hotlineCategoryTable,
});
