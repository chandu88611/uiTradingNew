import { CopyPlanInstance, StrategyDef, IndiaMasterSlot, IndiaFollowRequest } from "./copyIndia.types";

export const dummyIndiaCopyPlans: CopyPlanInstance[] = [
  {
    planId: "india_copy_basic",
    planName: "India Copy Basic",
    executionAllowed: true,
    limits: { maxMasterAccounts: 2, maxFollowers: 20, maxStrategies: 1 },
  },
  {
    planId: "india_copy_elite",
    planName: "India Copy Elite",
    executionAllowed: true,
    limits: { maxMasterAccounts: 5, maxFollowers: 200, maxStrategies: 2 },
  },
];

export const dummyIndiaStrategies: StrategyDef[] = [
  { id: "simple_trend", name: "Simple Trend", description: "Basic trend-following entry/exit for copy plan." },
  { id: "breakout", name: "Breakout", description: "One breakout strategy (per plan limits)." },
];

export const seedMasterSlots: IndiaMasterSlot[] = [
  {
    id: "slot_1",
    masterId: "IND-CT-482913",
    broker: "DHAN",
    nickname: "Dhan Master",
    enabled: true,
    token: "", // not given (share ID with follower)
    createdAt: "2026-01-20T03:27:00.000Z",
    updatedAt: "2026-01-20T03:27:00.000Z",
  },
  {
    id: "slot_2",
    masterId: "IND-CT-883120",
    broker: "KITE",
    nickname: "Kite Master",
    enabled: true,
    token: "****",
    createdAt: "2026-01-19T12:37:00.000Z",
    updatedAt: "2026-01-20T08:58:00.000Z",
  },
];

export const seedFollowRequests: IndiaFollowRequest[] = [
  {
    id: "req_1",
    masterId: "IND-CT-482913",
    followerName: "Rahul",
    followerEmail: "rahul@mail.com",
    status: "PENDING",
    createdAt: "2026-01-21T08:00:00.000Z",
    updatedAt: "2026-01-21T08:00:00.000Z",
  },
  {
    id: "req_2",
    masterId: "IND-CT-883120",
    followerName: "Neha",
    followerEmail: "neha@mail.com",
    status: "APPROVED",
    followerAccountLabel: "Neha Kite",
    followerToken: "****",
    createdAt: "2026-01-21T07:00:00.000Z",
    updatedAt: "2026-01-21T09:00:00.000Z",
  },
];
