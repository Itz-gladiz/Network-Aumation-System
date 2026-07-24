import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, ShieldAlert } from "lucide-react";
import Topbar from "../components/Topbar";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../api/users";
import { mockUsers } from "../mock/data";

const emptyForm = { username: "", email: "", password: "", role: "VIEWER" };

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.list().then(({ data }) => setUsers(data.results ?? data)).catch(() => {});
  }, []);

  if (me && me.role !== "ADMIN") {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Users" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <ShieldAlert size={32} className="mx-auto mb-3" />
            <p className="font-medium text-slate-500">Admins only</p>
            <p className="text-sm">You don't have permission to manage users.</p>
          </div>
        </main>
      </div>
    );
  }

  async function handleRoleChange(id, role) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    try {
      await usersApi.update(id, { role });
    } catch {
      // optimistic UI already applied; a real failure will surface on next refresh
    }
  }

  async function handleToggleActive(u) {
    const is_active = !u.is_active;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active } : x)));
    try {
      await usersApi.update(u.id, { is_active });
    } catch {}
  }

  async function handleDelete(id) {
    if (!confirm("Remove this user? They will lose access immediately.")) return;
    try {
      await usersApi.remove(id);
    } finally {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const { data } = await usersApi.create(form);
      setUsers((prev) => [...prev, data]);
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      alert(err?.response?.data?.username?.[0] || err?.response?.data?.password?.[0] || "Could not create user.");
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: "username", header: "Username", render: (u) => <span className="font-medium text-brand-600">{u.username}</span> },
    { key: "email", header: "Email", render: (u) => u.email || "—" },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <select
          className="input py-1 text-sm w-40"
          value={u.role}
          disabled={u.id === me?.id}
          onChange={(e) => handleRoleChange(u.id, e.target.value)}
        >
          <option value="ADMIN">Administrator</option>
          <option value="ENGINEER">Network Engineer</option>
          <option value="VIEWER">Viewer</option>
        </select>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (u) => (
        <button
          onClick={() => handleToggleActive(u)}
          disabled={u.id === me?.id}
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          } disabled:opacity-50`}
        >
          {u.is_active ? "Active" : "Disabled"}
        </button>
      ),
    },
    { key: "date_joined", header: "Joined", render: (u) => new Date(u.date_joined).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <button
          onClick={() => handleDelete(u.id)}
          disabled={u.id === me?.id}
          className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 disabled:opacity-30"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Users" subtitle={`${users.length} team members — Admin only`} />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add User
          </button>
        </div>

        <DataTable columns={columns} rows={users} />
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add User"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.username || !form.password}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Create User
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Username *</label>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="ADMIN">Administrator</option>
              <option value="ENGINEER">Network Engineer</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
