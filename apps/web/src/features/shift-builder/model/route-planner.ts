import type { ShiftMatch } from "./shift-results";

export type TravelMatrix = { buildings: string[]; minutes: number[][] };
export type RouteStop = ShiftMatch & {
  arrival: number;
  start: number;
  end: number;
  travel: number;
  remaining: number;
};
export type ShiftRoute = { stops: RouteStop[]; workCount: number; exact: boolean };

// Use the same groups and active classrooms as the room group editor, including
// empty groups and Ungrouped. Row/column order is shared by every edge lookup.
export function createTravelMatrix(groupLabels: string[], roomGroups: string[]): TravelMatrix {
  const buildings = [...new Set([...groupLabels, ...roomGroups])].sort();
  return { buildings, minutes: buildings.map(() => buildings.map(() => 0)) };
}

type State = { mask: bigint; last: number; time: number; stops: RouteStop[]; score: number };
const FRONTIER_LIMIT = 256;
const LARGE_FRONTIER_LIMIT = 32;
const LARGE_ROOM_COUNT = 20;
const EDGE_LIMIT = 500_000;

export function planShiftRoute(
  matches: ShiftMatch[],
  shiftStart: number,
  shiftEnd: number,
  maintenance: number,
  matrix: TravelMatrix
): ShiftRoute {
  if (!Number.isInteger(maintenance) || maintenance < 1 || shiftEnd <= shiftStart) {
    return { stops: [], workCount: 0, exact: true };
  }
  const candidates = [...new Map(matches.map((match) => [match.room._id, match])).values()].map((match) => ({
    ...match,
    openings: [...match.openings].sort((a, b) => a.startTimeMin - b.startTimeMin),
  }));
  const frontierLimit = candidates.length > LARGE_ROOM_COUNT ? LARGE_FRONTIER_LIMIT : FRONTIER_LIMIT;
  const buildingIndex = new Map(matrix.buildings.map((building, index) => [building, index]));
  const rank = (a: State, b: State) => b.score - a.score || a.time - b.time || b.stops.length - a.stops.length;
  let best: State = { mask: 0n, last: -1, time: shiftStart, stops: [], score: 0 };
  let frontier = [best];
  let exact = true;
  let edges = 0;

  // Search room-to-room edges. At each depth, an earlier finish dominates a
  // later finish for the same visited set and last room (waiting is allowed).
  for (let depth = 0; depth < candidates.length && frontier.length; depth += 1) {
    const next = new Map<string, State>();
    for (const state of frontier) {
      for (const [index, match] of candidates.entries()) {
        edges += 1;
        if (edges > EDGE_LIMIT) return { stops: best.stops, workCount: best.score, exact: false };
        // biome-ignore lint/suspicious/noBitwiseOperators: BigInt bitset tracks visited rooms without a 32-room limit.
        const bit = 1n << BigInt(index);
        // biome-ignore lint/suspicious/noBitwiseOperators: Test this room's visited bit.
        if (state.mask & bit) continue;
        let travel = 0;
        if (state.last !== -1) {
          const previous = candidates[state.last];
          const from = previous && buildingIndex.get(previous.room.groupKey);
          const to = buildingIndex.get(match.room.groupKey);
          // A missing/invalid edge is unreachable, never silently free.
          travel = from === undefined || to === undefined ? Number.POSITIVE_INFINITY : (matrix.minutes[from]?.[to] ?? Number.POSITIVE_INFINITY);
          if (!Number.isFinite(travel) || travel < 0) continue;
        }
        const arrival = state.time + travel;
        const opening = match.openings.find(
          (block) => Math.max(arrival, block.startTimeMin) + maintenance <= Math.min(block.endTimeMin, shiftEnd)
        );
        if (!opening) continue;
        const start = Math.max(arrival, opening.startTimeMin);
        const end = start + maintenance;
        // biome-ignore lint/suspicious/noBitwiseOperators: Mark this room visited for this branch only.
        const mask = state.mask | bit;
        const candidate: State = {
          mask,
          last: index,
          time: end,
          score: state.score + 1 + match.room.openTasksCount + match.room.activeIssuesCount,
          stops: [...state.stops, { ...match, arrival, start, end, travel, remaining: shiftEnd - end }],
        };
        const key = `${mask}:${index}`;
        const existing = next.get(key);
        if (!existing || candidate.time < existing.time) next.set(key, candidate);
        if (rank(candidate, best) < 0) best = candidate;
      }
    }
    const ordered = [...next.values()].sort(rank);
    if (ordered.length > frontierLimit) exact = false;
    frontier = ordered.slice(0, frontierLimit);
  }
  return { stops: best.stops, workCount: best.score, exact };
}
