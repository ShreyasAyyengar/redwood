import { attributesRouter } from "../core/attributes-routers";
import { classroomRouter } from "../core/classroom-router";
import { issueRouter } from "../core/issue-router";
import { maintenanceRouter } from "../core/maintenance-router";
import { taskRouter } from "../core/task-router";
import { userRouter } from "../core/user-router";

export const httpRouter = {
  classrooms: classroomRouter,
  maintenance: maintenanceRouter,
  issues: issueRouter,
  tasks: taskRouter,
  users: userRouter,
  attributes: attributesRouter,
};
