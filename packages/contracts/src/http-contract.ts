import { classroomContract } from "./classroom-contract";
import { maintenanceContract } from "./maintenance-contract";
import { userContract } from "./user-contract";

export const httpContract = {
  classrooms: classroomContract,
  users: userContract,
  maintenance: maintenanceContract,
};
