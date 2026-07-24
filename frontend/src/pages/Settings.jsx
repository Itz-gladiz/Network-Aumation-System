import { useEffect, useState } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import Topbar from "../components/Topbar";
import RequireRole from "../components/RequireRole";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth";
import { settingsApi } from "../api/settings";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Settings" subtitle="Your account, and (for Admins) system-wide defaults" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
        <ProfileCard user={user} />
        <PasswordCard />
        <RequireRole roles={["ADMIN"]}>
          <SystemDefaultsCard />
        </RequireRole>
      </main>
    </div>
  );
}

// --- Your account: anyone can edit their own email --------------------------
function ProfileCard({ user }) {
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await authApi.updateProfile({ email });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">Your account</h2>
        <p className="text-sm text-slate-400">Visible to you only.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Username</label>
          <input className="input bg-slate-50" value={user?.username || ""} disabled />
        </div>
        <div>
          <label className="label">Role</label>
          <input className="input bg-slate-50" value={user?.role || ""} disabled />
        </div>
      </div>

      <div>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </section>
  );
}

// --- Change password ---------------------------------------------------------
function PasswordCard() {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (form.next !== form.confirm) {
      setMessage({ ok: false, text: "New passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.old, form.next);
      setMessage({ ok: true, text: "Password updated." });
      setForm({ old: "", next: "", confirm: "" });
    } catch (err) {
      const detail = err?.response?.data?.old_password || err?.response?.data?.new_password?.[0];
      setMessage({ ok: false, text: detail || "Could not update password." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="font-semibold text-slate-900">Change password</h2>
        <p className="text-sm text-slate-400">You'll keep your current session — no need to log in again.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Current password</label>
          <input type="password" className="input" value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">New password</label>
            <input type="password" className="input" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </div>
        </div>

        {message && (
          <p className={`text-sm px-3 py-2 rounded-lg ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Update password
        </button>
      </form>
    </section>
  );
}

// --- System-wide defaults: Admin only -----------------------------------------
function SystemDefaultsCard() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsApi.get().then(({ data }) => setSettings(data)).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { data } = await settingsApi.update(settings);
      setSettings(data);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <section className="card text-sm text-slate-400 flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> Loading system settings…
      </section>
    );
  }

  return (
    <section className="card space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-brand-600" />
        <div>
          <h2 className="font-semibold text-slate-900">System defaults</h2>
          <p className="text-sm text-slate-400">Applies to every device and deployment. Admin only.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">SSH connection timeout (seconds)</label>
          <input
            type="number"
            className="input"
            value={settings.ssh_timeout_seconds}
            onChange={(e) => setSettings({ ...settings, ssh_timeout_seconds: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Backup retention (days)</label>
          <input
            type="number"
            className="input"
            value={settings.backup_retention_days}
            onChange={(e) => setSettings({ ...settings, backup_retention_days: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.default_save_config}
            onChange={(e) => setSettings({ ...settings, default_save_config: e.target.checked })}
          />
          Save config (write memory) by default on new deployments
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.default_backup_before_deploy}
            onChange={(e) => setSettings({ ...settings, default_backup_before_deploy: e.target.checked })}
          />
          Back up a device before deploying to it, by default
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.email_alerts_on_failure}
            onChange={(e) => setSettings({ ...settings, email_alerts_on_failure: e.target.checked })}
          />
          Email alerts on failed backup/deployment
          <span className="text-xs text-slate-400">(toggle only — email sending isn't wired up yet)</span>
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save settings
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </section>
  );
}
