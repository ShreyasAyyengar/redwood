export type HotlineSolverInput = {
  availabilityProfile: unknown;
  enabled: boolean;
  schedulingClass: "STANDARD" | "RESERVE";
};

export function didHotlineSolverInputChange(previous: HotlineSolverInput, next: HotlineSolverInput) {
  return (
    previous.enabled !== next.enabled ||
    previous.schedulingClass !== next.schedulingClass ||
    JSON.stringify(previous.availabilityProfile) !== JSON.stringify(next.availabilityProfile)
  );
}
