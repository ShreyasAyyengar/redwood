import { oc } from "@orpc/contract";
import { z } from "zod";
import { attributesContract } from "./attributes/attributes-contract";
import { feedbackContract } from "./feedback/feedback-contract";
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
  attributes: attributesContract,
  groups: groupsContract,
  feedback: feedbackContract,
  sync: oc.route({ method: "GET" }).output(z.boolean()),
};
