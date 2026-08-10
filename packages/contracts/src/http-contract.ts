import { oc } from "@orpc/contract";
import { z } from "zod";
import { groupsContract } from "./groups/groups-contract";
import { issueContract } from "./issues/issue-contract";
import { maintenanceContract } from "./maintenance/maintenance-contract";
import { classroomContract } from "./rooms/classroom-schemas";
import { taskContract } from "./tasks/task-contract";
import { userContract } from "./users/user-contract";

export const httpContract = {
  classrooms: classroomContract,
  maintenance: maintenanceContract,
  issues: issueContract,
  tasks: taskContract,
  users: userContract,
  groups: groupsContract,
  sync: oc.route({ method: "GET" }).output(z.boolean()),
};
