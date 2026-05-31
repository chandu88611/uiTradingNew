export type SubscriptionPayload = {
  data?: any[];
  followers?: any[];
};

export function pickSubscriptionPayload(subRes: any): SubscriptionPayload {
  // new: { subscription: { data, followers } }
  if (subRes?.subscription && typeof subRes.subscription === "object") {
    return subRes.subscription as SubscriptionPayload;
  }

  // old fallbacks
  if (subRes?.data?.subscription) return subRes.data.subscription as SubscriptionPayload;
  if (subRes?.data && typeof subRes.data === "object") return subRes.data as SubscriptionPayload;

  return { data: [], followers: [] };
}
