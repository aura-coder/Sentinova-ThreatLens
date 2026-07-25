import { useEffect, useState } from "react";
import { apiFetch } from "../lib/auth";

type Indicator = {
  id: string;
  value: string;
  type: string;
  severity_score: number;
  confidence: number;
  tlp: string;
  status: string;
  notes?: string;
};

type Props = {
  open: boolean;
  indicator: Indicator | null;
  onClose: () => void;
};

export default function IndicatorDrawer({
  open,
  indicator,
  onClose,
}: Props) {
  const [status, setStatus] = useState("");
  const [tlp, setTlp] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

async function saveIndicator() {
  if (!indicator) return;

  setSaving(true);

  try {
    const response = await apiFetch(
      `/api/v1/indicators/${indicator.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          tlp,
          notes,
        }),
      }
    );

    if (!response.ok) {
      alert("Failed to save changes.");
      return;
    }

    alert("Indicator updated successfully.");
    onClose();
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  } finally {
    setSaving(false);
  }
}

  useEffect(() => {
    if (indicator) {
      setStatus(indicator.status);
      setTlp(indicator.tlp);
      setNotes(indicator.notes ?? "");
    }
  }, [indicator]);

  if (!open || !indicator) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-[420px] bg-[#111827] border-l border-gray-700 shadow-2xl z-50 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">
          Indicator Details
        </h2>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">

        <div>
          <p className="text-gray-400 text-sm">Indicator</p>
          <p className="text-white break-all text-lg">
            {indicator.value}
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Type</p>
          <p className="text-white">{indicator.type}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Severity</p>
          <p className="text-white">{indicator.severity_score}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Confidence</p>
          <p className="text-white">{indicator.confidence}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">TLP</p>

          <select
            value={tlp}
            onChange={(e) => setTlp(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2"
          >
            <option value="clear">Clear</option>
            <option value="green">Green</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Status</p>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="whitelisted">Whitelisted</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-2">Analyst Notes</p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Add investigation notes..."
            className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 resize-none"
          />
        </div>

              <button
                  onClick={saveIndicator}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                  {saving ? "Saving..." : "Save Changes"}
              </button>

      </div>
    </div>
  );
}