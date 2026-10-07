export type PropValue = string | number | boolean | null | string[];

export type Props = Record<string, PropValue>;

export type GraphNode = {
  id: string;
  labels: string[];
  props: Props;
};

export type GraphRel = {
  id: string;
  type: string;
  from: string;
  to: string;
  props: Props;
};

export type GraphSnapshot = {
  name: string;
  nodes: GraphNode[];
  rels: GraphRel[];
  nextRel: number;
};

export type PathHop = {
  nodeId: string;
  relType?: string;
  relId?: string;
};

export type FactRecord = {
  id: string;
  subjectId: string;
  subjectLabels: string[];
  predicate: string;
  objectValue: string;
  validFrom: string;
  validTo: string | null;
  observedAt: string;
  confidence: number;
  status: string;
  sourceId: string;
  supersededBy?: string;
};

export type ChangeKind = "NEW_AFTER_EARLIER_TIME" | "EXPIRED_BY_LATER_TIME" | "SUPERSEDED" | "PERSISTED";

export type FactChange = FactRecord & { changeKind: ChangeKind };

export type ShelterCandidate = {
  shelterId: string;
  shelterName: string;
  zoneId: string;
  zoneName: string;
  needId: string;
  availableCapacity: number;
  routeMinutes: number;
  routeOpen: boolean;
  routeSiteIds: string[];
  routeRoadIds: string[];
  blockedRoads: string[];
  authorityAgencyId: string | null;
  assetId: string | null;
  blockingReasons: string[];
  isViable: boolean;
  score: number;
};

export const GRAPH_NAME = "watchchange_flood_demo";

export const T14 = "2026-10-15T14:00:00Z";
export const T1630 = "2026-10-15T16:30:00Z";
export const T18 = "2026-10-15T18:00:00Z";
export const T_HANDOFF = "2026-10-15T17:55:00Z";

export function isValidAt(from: string | null | undefined, to: string | null | undefined, t: string): boolean {
  if (from && from > t) return false;
  if (to && to <= t) return false;
  return true;
}
