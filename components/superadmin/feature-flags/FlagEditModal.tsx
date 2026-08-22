"use client";

import { useState, useEffect } from "react";
import type {
  FeatureFlagItem,
  FlagCategory,
  FlagStatus,
  FlagEnvironment,
  TargetScope,
  RiskLevel,
} from "@/lib/supabase/superadmin_feature_flags";

interface FlagEditModalProps {
  flag: FeatureFlagItem | null; // null if creating a new flag
  isOpen: boolean;
  onClose: () => void;
  onSave: (flagData: Partial<FeatureFlagItem>, reason: string) => Promise<boolean>;
  onKillSwitch: (flagKey: string, reason: string) => Promise<boolean>;
}

const CATEGORIES: FlagCategory[] = [
  "Student",
  "Vendor",
  "Super Admin",
  "Payments",
  "Orders",
  "Offers",
  "Analytics",
  "Experimental",
  "Disputes",
  "System",
];

const STATUSES: FlagStatus[] = ["ENABLED", "DISABLED", "SCHEDULED", "ROLLOUT"];
const ENVIRONMENTS: FlagEnvironment[] = ["production", "staging", "development"];
const TARGET_SCOPES: TargetScope[] = ["ALL USERS", "PERCENTAGE", "CAMPUS", "VENDOR", "USER"];
const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function FlagEditModal({
  flag,
  isOpen,
  onClose,
  onSave,
  onKillSwitch,
}: FlagEditModalProps) {
  const isEditing = Boolean(flag);

  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FlagCategory>("System");
  const [status, setStatus] = useState<FlagStatus>("DISABLED");
  const [environment, setEnvironment] = useState<FlagEnvironment>("production");
  const [rolloutPercentage, setRolloutPercentage] = useState<number>(100);
  const [targetScope, setTargetScope] = useState<TargetScope>("ALL USERS");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("LOW");
  const [isHighImpact, setIsHighImpact] = useState(false);
  const [targetCampusIds, setTargetCampusIds] = useState("");
  const [targetVendorIds, setTargetVendorIds] = useState("");
  const [targetUserIds, setTargetUserIds] = useState("");
  const [scheduleEnableAt, setScheduleEnableAt] = useState("");
  const [scheduleDisableAt, setScheduleDisableAt] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flag) {
      setKey(flag.key);
      setName(flag.name);
      setDescription(flag.description || "");
      setCategory(flag.category);
      setStatus(flag.status);
      setEnvironment(flag.environment);
      setRolloutPercentage(flag.rolloutPercentage);
      setTargetScope(flag.targetScope);
      setRiskLevel(flag.riskLevel);
      setIsHighImpact(flag.isHighImpact);
      setTargetCampusIds((flag.targetCampusIds || []).join(", "));
      setTargetVendorIds((flag.targetVendorIds || []).join(", "));
      setTargetUserIds((flag.targetUserIds || []).join(", "));
      setScheduleEnableAt(flag.scheduleEnableAt ? flag.scheduleEnableAt.slice(0, 16) : "");
      setScheduleDisableAt(flag.scheduleDisableAt ? flag.scheduleDisableAt.slice(0, 16) : "");
    } else {
      setKey("");
      setName("");
      setDescription("");
      setCategory("System");
      setStatus("DISABLED");
      setEnvironment("production");
      setRolloutPercentage(100);
      setTargetScope("ALL USERS");
      setRiskLevel("LOW");
      setIsHighImpact(false);
      setTargetCampusIds("");
      setTargetVendorIds("");
      setTargetUserIds("");
      setScheduleEnableAt("");
      setScheduleDisableAt("");
    }
    setReason("");
    setError(null);
  }, [flag, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isHighImpact && !reason.trim()) {
      setError("A mandatory explanation reason is required for high-impact feature flag changes.");
      return;
    }

    const parsedCampus = targetCampusIds
      ? targetCampusIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const parsedVendors = targetVendorIds
      ? targetVendorIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const parsedUsers = targetUserIds
      ? targetUserIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const flagPayload: Partial<FeatureFlagItem> = {
      key: key.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim(),
      category,
      status,
      environment,
      rolloutPercentage: Number(rolloutPercentage),
      targetScope,
      riskLevel,
      isHighImpact,
      targetCampusIds: parsedCampus,
      targetVendorIds: parsedVendors,
      targetUserIds: parsedUsers,
      scheduleEnableAt: scheduleEnableAt ? new Date(scheduleEnableAt).toISOString() : null,
      scheduleDisableAt: scheduleDisableAt ? new Date(scheduleDisableAt).toISOString() : null,
    };

    try {
      setSubmitting(true);
      setError(null);
      const success = await onSave(flagPayload, reason);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save feature flag.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerKillSwitch = async () => {
    if (!key) return;
    if (!reason.trim()) {
      setError("A reason explanation is mandatory when triggering an Emergency Kill Switch.");
      return;
    }

    if (!confirm(`EMERGENCY KILL SWITCH: Are you sure you want to IMMEDIATELY DISABLE feature flag '${key}' in production?`)) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onKillSwitch(key, reason);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Emergency Kill Switch failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono text-orange-400 uppercase tracking-wider font-semibold">
              {isEditing ? `EDIT FEATURE FLAG (${flag?.key})` : "CREATE NEW FEATURE FLAG"}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {isEditing ? flag?.name : "Configure New Feature Flag"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* High Impact Warning Banner */}
        {isHighImpact && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-icons text-base text-rose-400">warning</span>
              Production Impact Warning
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              This change may immediately affect production users across live campuses and active sessions.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key & Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Flag Key <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                disabled={isEditing}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. vendor_instant_payouts"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-200 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Feature Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vendor Instant Payout Engine"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational description of feature functionality..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category, Status, Environment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FlagCategory)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FlagStatus)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-semibold text-orange-400 focus:outline-none focus:border-orange-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as FlagEnvironment)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              >
                {ENVIRONMENTS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gradual Rollout Percentage & Target Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Rollout %: <span className="font-mono text-orange-400 font-bold">{rolloutPercentage}%</span>
              </label>
              <select
                value={rolloutPercentage}
                onChange={(e) => setRolloutPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
              >
                {[0, 1, 5, 10, 25, 50, 75, 100].map((pct) => (
                  <option key={pct} value={pct}>
                    {pct}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Target Scope</label>
              <select
                value={targetScope}
                onChange={(e) => setTargetScope(e.target.value as TargetScope)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                {TARGET_SCOPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* High Impact Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isHighImpact}
                onChange={(e) => setIsHighImpact(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-700 text-orange-500 focus:ring-orange-500 h-4 w-4"
              />
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                <span className="material-icons text-xs">warning</span> High Impact Production Setting
              </span>
            </label>
          </div>

          {/* Explicit Target ID Override Inputs (Campus / Vendor / User) */}
          {targetScope !== "ALL USERS" && targetScope !== "PERCENTAGE" && (
            <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="text-xs font-semibold text-zinc-400 uppercase">Explicit Target IDs (Comma-separated)</div>
              {targetScope === "CAMPUS" && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Campus IDs</label>
                  <input
                    type="text"
                    value={targetCampusIds}
                    onChange={(e) => setTargetCampusIds(e.target.value)}
                    placeholder="cmp_axis_01, cmp_north_02"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200"
                  />
                </div>
              )}
              {targetScope === "VENDOR" && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Vendor / Canteen IDs</label>
                  <input
                    type="text"
                    value={targetVendorIds}
                    onChange={(e) => setTargetVendorIds(e.target.value)}
                    placeholder="CANTEEN-123, CANTEEN-456"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200"
                  />
                </div>
              )}
              {targetScope === "USER" && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">User IDs</label>
                  <input
                    type="text"
                    value={targetUserIds}
                    onChange={(e) => setTargetUserIds(e.target.value)}
                    placeholder="usr_1001, usr_1002"
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200"
                  />
                </div>
              )}
            </div>
          )}

          {/* Timezone-Aware Schedule Timestamps */}
          {status === "SCHEDULED" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Schedule Enable At</label>
                <input
                  type="datetime-local"
                  value={scheduleEnableAt}
                  onChange={(e) => setScheduleEnableAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Schedule Disable At</label>
                <input
                  type="datetime-local"
                  value={scheduleDisableAt}
                  onChange={(e) => setScheduleDisableAt(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200"
                />
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
              Reason for Change {isHighImpact && <span className="text-rose-400">*</span>}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain rationale for creating or modifying this feature flag..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              required={isHighImpact}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <div>
              {isEditing && isHighImpact && status !== "DISABLED" && (
                <button
                  type="button"
                  onClick={handleTriggerKillSwitch}
                  disabled={submitting}
                  className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span className="material-icons text-xs text-rose-400">warning</span>
                  DISABLE IMMEDIATELY
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
              >
                {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
                {isEditing ? "Save Changes" : "Create Flag"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
