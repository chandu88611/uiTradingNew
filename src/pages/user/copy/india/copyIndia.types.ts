export type CopyPlanLimits = {
  maxMasterAccounts: number;     // trader can create these many master slots
  maxFollowers: number;          // how many followers can be approved
  maxStrategies: number;         // usually 1 for basic copy plan
};

export type CopyPlanInstance = {
  planId: string;
  planName: string;
  executionAllowed: boolean;
  limits: CopyPlanLimits;
};

export type PlanSignals = {
  strategiesEnabled: boolean;
  webhookEnabled: boolean;
};
export type PlanSignalSettings = Record<string, PlanSignals>;

export type StrategyDef = {
  id: string;
  name: string;
  description: string;
};

export type StrategySelections = Record<string, string[]>; // planId -> enabled strategy ids

// TRADER creates a “master slot” and shares masterId to followers.
export type IndiaMasterSlot = {
  id: string;            // internal ui id
  masterId: string;      // shareable unique id (followers enter this)
  broker: "KITE" | "DHAN" | "ANGEL" | "UPSTOX" | "FYERS" | "SHOONYA" | "ALICEBLUE";
  nickname: string;
  enabled: boolean;
  token?: string;        // optional: trader may store, else follower stores later
  createdAt: string;
  updatedAt: string;
};

// follower requests access to a masterId
export type FollowRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IndiaFollowRequest = {
  id: string;
  masterId: string;
  followerName: string;
  followerEmail?: string;
  status: FollowRequestStatus;
  createdAt: string;
  updatedAt: string;

  // once approved, follower can attach token/credentials from their side
  followerToken?: string;
  followerAccountLabel?: string;
};
