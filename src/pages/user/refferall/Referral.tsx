import React, { useCallback, useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Users,
  Wallet,
  Clock3,
  Lock,
  Copy,
  CheckCircle2,
  Search,
  BadgeIndianRupee,
  ShieldCheck,
  Settings,
  Layers3,
  Network,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import {
  useGetMyReferralQuery,
  useGetUserSettingsQuery,
  type ReferralLevel,
  type KycStatus,
  type SettlementStatus,
  type ReferralNode,
} from "../../../services/userApi";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type TabKey =
  | "overview"
  | "network"
  | "earnings"
  | "withdrawals"
  | "settings";

type Member = {
  id: string;
  parentId: string | null;
  name: string;
  plan: string;
  joined: string;
  commission: number;
  volumeTraded: number;
  daysUntilUnlock: number;
  kycStatus: KycStatus;
  settlementStatus: SettlementStatus;
  level: ReferralLevel;
};

type ReferralNodeData = {
  label: string;
  plan: string;
  level: ReferralLevel;
  commission: number;
  volumeTraded: number;
  kycStatus: KycStatus;
  settlementStatus: SettlementStatus;
  childCount: number;
};

function formatMoney(value?: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLevelLabel(level: ReferralLevel) {
  if (level === 1) return "Direct";
  if (level === 2) return "Level 2";
  return "Level 3";
}

function getSettlementTone(status: SettlementStatus) {
  if (status === "UNLOCKED") return "success" as const;
  if (status === "FROZEN") return "danger" as const;
  return "default" as const;
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
      : tone === "info"
      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-200"
      : "border-slate-700 bg-slate-800 text-slate-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        toneClass
      )}
    >
      {children}
    </span>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-slate-800 p-2 text-emerald-300">
          {icon}
        </div>
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </Card>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-emerald-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function ReferralTreeNode({ data }: NodeProps<Node<ReferralNodeData>>) {
  return (
    <div className="w-[260px] rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {data.label}
          </div>
          <div className="mt-1 text-xs text-slate-400">{data.plan}</div>
        </div>
        <Badge tone="info">{getLevelLabel(data.level)}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={data.kycStatus === "VERIFIED" ? "success" : "warning"}>
          KYC {data.kycStatus === "VERIFIED" ? "Verified" : "Incomplete"}
        </Badge>
        <Badge tone={getSettlementTone(data.settlementStatus)}>
          {data.settlementStatus}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-500">Commission</div>
          <div className="font-medium text-slate-200">
            {formatMoney(data.commission)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Volume</div>
          <div className="font-medium text-slate-200">
            {formatMoney(data.volumeTraded)}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Children: <span className="text-slate-300">{data.childCount}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
}

const nodeTypes = {
  referralNode: ReferralTreeNode,
};

const NODE_WIDTH = 260;
const NODE_HEIGHT = 165;

function getLayoutedElements(
  nodes: Node<ReferralNodeData>[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
) {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === "LR";

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 70,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function buildChildrenCountMap(members: Member[]) {
  const counts = new Map<string, number>();
  for (const member of members) {
    if (member.parentId) {
      counts.set(member.parentId, (counts.get(member.parentId) ?? 0) + 1);
    }
  }
  return counts;
}

function buildFlowData(members: Member[]) {
  const childCounts = buildChildrenCountMap(members);

  const nodes: Node<ReferralNodeData>[] = members.map((member) => ({
    id: member.id,
    type: "referralNode",
    position: { x: 0, y: 0 },
    data: {
      label: member.name,
      plan: member.plan,
      level: member.level,
      commission: member.commission,
      volumeTraded: member.volumeTraded,
      kycStatus: member.kycStatus,
      settlementStatus: member.settlementStatus,
      childCount: childCounts.get(member.id) ?? 0,
    },
  }));

  const edges: Edge[] = members
    .filter((member) => member.parentId)
    .map((member) => ({
      id: `e-${member.parentId}-${member.id}`,
      source: member.parentId!,
      target: member.id,
      type: "smoothstep",
      animated: false,
      style: { stroke: "#64748b" },
    }));

  return getLayoutedElements(nodes, edges, "TB");
}

function flattenReferralNodes(
  nodes: ReferralNode[] = [],
  parentId: string | null = null,
  level?: number
): Member[] {
  const output: Member[] = [];

  for (const node of nodes) {
    const currentId = String(node.id ?? node.userId ?? crypto.randomUUID());
    const currentLevel = Number(node.level ?? level ?? 1) as ReferralLevel;

    output.push({
      id: currentId,
      parentId,
      name: node.name || node.userName || "User",
      plan: node.plan || node.planName || "No Plan",
      joined: formatDate(node.joined || node.createdAt),
      commission: Number(node.commission ?? 0),
      volumeTraded: Number(node.volumeTraded ?? node.tradeVolume ?? 0),
      daysUntilUnlock: Number(node.daysUntilUnlock ?? 0),
      kycStatus:
        node.kycStatus === "INCOMPLETE" ? "INCOMPLETE" : "VERIFIED",
      settlementStatus:
        node.settlementStatus === "UNLOCKED"
          ? "UNLOCKED"
          : node.settlementStatus === "FROZEN"
          ? "FROZEN"
          : "PENDING",
      level:
        currentLevel === 2 || currentLevel === 3 ? currentLevel : 1,
    });

    if (node.children?.length) {
      output.push(...flattenReferralNodes(node.children, currentId, currentLevel + 1));
    }
  }

  return output;
}

function NetworkTable({ rows }: { rows: Member[] }) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "1" | "2" | "3">("ALL");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.plan.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);

      const matchesLevel =
        levelFilter === "ALL" || String(row.level) === levelFilter;

      return matchesQuery && matchesLevel;
    });
  }, [rows, query, levelFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, plan, or id"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-10 py-2.5 text-sm text-white outline-none"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as any)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="ALL">All Levels</option>
          <option value="1">Direct</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/80">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {filtered.map((row) => (
              <tr key={row.id} className="text-sm">
                <td className="px-4 py-3 text-white">
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.joined}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {getLevelLabel(row.level)}
                </td>
                <td className="px-4 py-3 text-slate-200">{row.plan}</td>
                <td className="px-4 py-3 text-slate-200">
                  {formatMoney(row.commission)}
                </td>
                <td className="px-4 py-3 text-slate-200">
                  {formatMoney(row.volumeTraded)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.kycStatus === "VERIFIED" ? "success" : "warning"}>
                    {row.kycStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={getSettlementTone(row.settlementStatus)}>
                    {row.settlementStatus}
                  </Badge>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No referral users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferralDashboardInner() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    data: referralRes,
    isLoading: referralLoading,
    refetch: refetchReferral,
  } = useGetMyReferralQuery();

  const {
    data: settingsRes,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useGetUserSettingsQuery();

  const referralPayload = referralRes?.data ?? {};
  const settings = settingsRes?.data;

  const referralUser = referralPayload?.user || referralPayload?.me || {};
  const activeCode =
    referralPayload?.referralCode ||
    referralUser?.referralCode ||
    "";

  const referralBaseUrl =
    (import.meta as any)?.env?.VITE_APP_URL || window.location.origin;

  const link = activeCode
    ? `${referralBaseUrl.replace(/\/$/, "")}/sign-up?ref=${encodeURIComponent(activeCode)}`
    : "";

  const members: Member[] = useMemo(() => {
    if (Array.isArray(referralPayload?.tree)) {
      return flattenReferralNodes(referralPayload.tree);
    }
    if (Array.isArray(referralPayload?.network)) {
      return flattenReferralNodes(referralPayload.network);
    }
    if (Array.isArray(referralPayload?.referrals)) {
      return flattenReferralNodes(referralPayload.referrals);
    }
    return [];
  }, [referralPayload]);

  const { nodes, edges } = useMemo(() => buildFlowData(members), [members]);

  const wallet = settings?.wallet;
  const currency = wallet?.currency || "INR";

  const summary = useMemo(() => {
    return {
      totalEarned: wallet?.totalEarned ?? 0,
      pendingRewards: wallet?.pendingRewards ?? 0,
      withdrawableAmount: wallet?.withdrawableAmount ?? 0,
      lockedWithdrawalAmount: wallet?.lockedWithdrawalAmount ?? 0,
      totalWithdrawn: wallet?.totalWithdrawn ?? 0,
      minWithdrawalAmount: wallet?.minWithdrawalAmount ?? 0,
      holdDays: wallet?.holdDays ?? 0,
    };
  }, [wallet]);

  const directCount = members.filter((m) => m.level === 1).length;
  const level2Count = members.filter((m) => m.level === 2).length;
  const level3Count = members.filter((m) => m.level === 3).length;

  const directTotal = members
    .filter((m) => m.level === 1)
    .reduce((sum, m) => sum + m.commission, 0);

  const level2Total = members
    .filter((m) => m.level === 2)
    .reduce((sum, m) => sum + m.commission, 0);

  const level3Total = members
    .filter((m) => m.level === 3)
    .reduce((sum, m) => sum + m.commission, 0);

  const totalMembers = members.length;

  const copyLink = useCallback(async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    } catch {
      setCopiedLink(false);
    }
  }, [link]);

  const copyCode = useCallback(async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      setCopiedCode(false);
    }
  }, [activeCode]);

  const loading = referralLoading || settingsLoading;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "network", label: "Network" },
    { key: "earnings", label: "Earnings" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Referral Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Referral Program
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Real values from referral and settings APIs.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                refetchReferral();
                refetchSettings();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <Card className="mb-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Referral Code</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="truncate text-base font-semibold tracking-[0.18em] text-emerald-300">
                  {loading ? "Loading..." : activeCode || "-"}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  disabled={!activeCode}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-50"
                >
                  {copiedCode ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-500">Referral Link</p>
              <div className="mt-1 flex items-center gap-2">
                <LinkIcon size={14} className="shrink-0 text-slate-500" />
                <p className="truncate text-sm text-white">
                  {loading ? "Loading..." : link || "-"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={copyLink}
              disabled={!link}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Earned"
            value={formatMoney(summary.totalEarned, currency)}
            sub="From wallet.totalEarned"
            icon={<BadgeIndianRupee size={18} />}
          />
          <StatCard
            title="Pending Rewards"
            value={formatMoney(summary.pendingRewards, currency)}
            sub="From wallet.pendingRewards"
            icon={<Clock3 size={18} />}
          />
          <StatCard
            title="Withdrawable"
            value={formatMoney(summary.withdrawableAmount, currency)}
            sub="From wallet.withdrawableAmount"
            icon={<Wallet size={18} />}
          />
          <StatCard
            title="Locked"
            value={formatMoney(summary.lockedWithdrawalAmount, currency)}
            sub="From wallet.lockedWithdrawalAmount"
            icon={<Lock size={18} />}
          />
          <StatCard
            title="Withdrawn"
            value={formatMoney(summary.totalWithdrawn, currency)}
            sub="From wallet.totalWithdrawn"
            icon={<Wallet size={18} />}
          />
        </div>

        <div className="mt-6 flex overflow-x-auto">
          <div className="inline-flex gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={clsx(
                  "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition",
                  tab === item.key
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Layers3 size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Level Meaning</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="info">Direct</Badge>
                      <span className="font-medium text-white">Level 1</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Users who joined directly using your referral code.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center gap-2">
                      <Badge>Level 2</Badge>
                      <span className="font-medium text-white">
                        Users referred by your direct users.
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center gap-2">
                      <Badge>Level 3</Badge>
                      <span className="font-medium text-white">
                        Users referred by your level 2 users.
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <Network size={18} className="text-emerald-300" />
                    <h3 className="text-base font-semibold text-white">Network Summary</h3>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">Direct</span>
                        <span className="font-medium text-white">{directCount}</span>
                      </div>
                      <Progress value={totalMembers ? (directCount / totalMembers) * 100 : 0} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">Level 2</span>
                        <span className="font-medium text-white">{level2Count}</span>
                      </div>
                      <Progress value={totalMembers ? (level2Count / totalMembers) * 100 : 0} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">Level 3</span>
                        <span className="font-medium text-white">{level3Count}</span>
                      </div>
                      <Progress value={totalMembers ? (level3Count / totalMembers) * 100 : 0} />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-300" />
                    <h3 className="text-base font-semibold text-white">Program Notes</h3>
                  </div>

                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      Hold period: <span className="font-medium text-white">{summary.holdDays || 0} days</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      Minimum withdrawal:{" "}
                      <span className="font-medium text-white">
                        {formatMoney(summary.minWithdrawalAmount, currency)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === "network" && (
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="min-h-[640px]">
                <div className="mb-4 flex items-center gap-2">
                  <Network size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Referral Tree</h3>
                </div>

                {!members.length ? (
                  <div className="flex h-[520px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 text-sm text-slate-500">
                    No referral tree data available.
                  </div>
                ) : (
                  <div className="h-[560px] rounded-xl border border-slate-800 bg-slate-950">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      nodeTypes={nodeTypes}
                      fitView
                    >
                      <MiniMap />
                      <Controls />
                      <Background />
                    </ReactFlow>
                  </div>
                )}
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Users size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Network Table</h3>
                </div>
                <NetworkTable rows={members} />
              </Card>
            </div>
          )}

          {tab === "earnings" && (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <BadgeIndianRupee size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Earnings Breakdown</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Total Earned</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.totalEarned, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Pending Rewards</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.pendingRewards, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Withdrawable</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.withdrawableAmount, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Locked Amount</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.lockedWithdrawalAmount, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Total Withdrawn</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.totalWithdrawn, currency)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Users size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">By Level</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Direct Earnings</span>
                    <span className="font-semibold text-white">
                      {formatMoney(directTotal, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Level 2 Earnings</span>
                    <span className="font-semibold text-white">
                      {formatMoney(level2Total, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Level 3 Earnings</span>
                    <span className="font-semibold text-white">
                      {formatMoney(level3Total, currency)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === "withdrawals" && (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Wallet size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Withdrawal Summary</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Withdrawable Amount</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.withdrawableAmount, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Locked Withdrawal Amount</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.lockedWithdrawalAmount, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Minimum Withdrawal</span>
                    <span className="font-semibold text-white">
                      {formatMoney(summary.minWithdrawalAmount, currency)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Hold Days</span>
                    <span className="font-semibold text-white">
                      {summary.holdDays} days
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Notes</h3>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    Pending rewards stay locked until the hold period is completed.
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    Only <span className="font-medium text-white">wallet.withdrawableAmount</span> should be used for withdrawal actions.
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    Remove the hardcoded withdrawal history unless backend sends a dedicated withdrawal history API.
                  </div>
                </div>
              </Card>
            </div>
          )}

          {tab === "settings" && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">User Settings</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Trading Enabled</span>
                    <Badge tone={settings?.trade?.allowTrade ? "success" : "danger"}>
                      {settings?.trade?.allowTrade ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-between">
                    <span className="text-slate-300">Copy Trade</span>
                    <Badge tone={settings?.copyTrade?.allowCopyTrade ? "success" : "danger"}>
                      {settings?.copyTrade?.allowCopyTrade ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Edging</span>
                      <Badge tone={settings?.edging?.isEnabled ? "success" : "default"}>
                        {settings?.edging?.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Updated: {formatDateTime(settings?.edging?.updatedAt)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Notes: {settings?.edging?.notes || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-slate-300">Risk Limits</span>
                      <Badge tone={settings?.riskLimits?.isEnabled ? "success" : "default"}>
                        {settings?.riskLimits?.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-500">Daily Loss Limit</div>
                        <div className="text-white">
                          {settings?.riskLimits?.dailyLossLimit != null
                            ? formatMoney(settings.riskLimits.dailyLossLimit, currency)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Daily Profit Target</div>
                        <div className="text-white">
                          {settings?.riskLimits?.dailyProfitTarget != null
                            ? formatMoney(settings.riskLimits.dailyProfitTarget, currency)
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Max Trades / Day</div>
                        <div className="text-white">
                          {settings?.riskLimits?.maxTradesPerDay ?? "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Cooldown After Loss</div>
                        <div className="text-white">
                          {settings?.riskLimits?.cooldownAfterLossMins != null
                            ? `${settings.riskLimits.cooldownAfterLossMins} mins`
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Updated: {formatDateTime(settings?.riskLimits?.updatedAt)}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <Users size={18} className="text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">Accounts</h3>
                </div>

                <div className="space-y-3">
                  {settings?.accounts?.length ? (
                    settings.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">
                              {account.accountLabel}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {account.accountId}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge tone={account.isEnabled ? "success" : "default"}>
                              {account.isEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                            <Badge tone={account.isMaster ? "info" : "default"}>
                              {account.isMaster ? "Master" : "Secondary"}
                            </Badge>
                            <Badge
                              tone={account.status === "verified" ? "success" : "warning"}
                            >
                              {account.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-slate-500">Broker</div>
                            <div className="text-white">
                              {account.broker?.name || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Market</div>
                            <div className="text-white">
                              {account.broker?.marketCategory || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Plan</div>
                            <div className="text-white">
                              {account.subscription?.planName || "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Subscription Status</div>
                            <div className="text-white">
                              {account.subscription?.status || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          Last verified: {formatDateTime(account.lastVerifiedAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-500">
                      No linked accounts found.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReferralDashboard() {
  return (
    <ReactFlowProvider>
      <ReferralDashboardInner />
    </ReactFlowProvider>
  );
}