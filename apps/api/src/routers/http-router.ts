import { attributesRouter } from "../core/attributes-routers";
import { classroomRouter } from "../core/classroom-router";
import { feedbackRouter } from "../core/feedback-router";
import { groupsRouter } from "../core/groups-router";
import { issueRouter, recomputeRoomStatus } from "../core/issue-router";
import { maintenanceRouter } from "../core/maintenance-router";
import { taskRouter } from "../core/task-router";
import { userRouter } from "../core/user-router";
import { ClassroomService } from "../database/classroom-service";
import { MaintenanceService } from "../database/maintenance-service";
import { adminProcedure } from "../libs/orpc-procedures";

export const httpRouter = {
  classrooms: classroomRouter,
  maintenance: maintenanceRouter,
  issues: issueRouter,
  tasks: taskRouter,
  users: userRouter,
  attributes: attributesRouter,
  groups: groupsRouter,
  feedback: feedbackRouter,

  // TODO define and make this better
  sync: adminProcedure.sync.handler(async () => {
    // calibrate roomStatus by checking if there are any active issues for each room
    const rooms = await ClassroomService.find({ isActive: true }).lean();
    for (const room of rooms) {
      await recomputeRoomStatus(room._id);
    }

    // check the last maintenance date of each classroom, and write it
    const classrooms = await ClassroomService.find({ isActive: true }).lean();
    for (const classroom of classrooms) {
      const lastMaintenance = await MaintenanceService.findOne({ classroomId: classroom._id }).sort({ date: -1 }).lean();
      await ClassroomService.findByIdAndUpdate(classroom._id, {
        lastMaintenance: {
          date: lastMaintenance?.date,
          by: lastMaintenance?.completedBy,
        },
      }).lean();
    }

    return true;
  }),
};
