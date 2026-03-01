import { classroomRouter } from "../core/classroom-router";
import { userRouter } from "../core/user-router";

export const httpRouter = {
  classrooms: classroomRouter,
  users: userRouter,
};
