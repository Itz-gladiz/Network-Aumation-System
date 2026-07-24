import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, FileCog } from "lucide-react";
import Topbar from "../components/Topbar";
import Modal from "../components/Modal";
import RequireRole from "../components/RequireRole";
import { templatesApi } from "../api/templates";
import { mockTemplates } from "../mock/data";

const emptyForm = { name: "", description: "", content: "" };

export default function Templates() {
  const [templates, setTemplates] = useState(mockTemplates);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    templatesApi.list().then(({ data }) => setTemplates(data.results ?? data)).catch(() => {});
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(t) {
    setForm({ name: t.name, description: t.description, content: t.content });
    setEditingId(t.id);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        const { data } = await templatesApi.update(editingId, form);
        setTemplates((prev) => prev.map((t) => (t.id === editingId ? data : t)));
      } else {
        const { data } = await templatesApi.create(form);
        setTemplates((prev) => [data, ...prev]);
      }
      setModalOpen(false);
    } catch {
      setTemplates((prev) =>
        editingId
          ? prev.map((t) => (t.id === editingId ? { ...t, ...form } : t))
          : [{ ...form, id: Date.now(), created_by_name: "you" }, ...prev]
      );
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this template?")) return;
    try {
      await templatesApi.remove(id);
    } finally {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Templates" subtitle="Reusable config snippets for deployments" />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-end">
          <RequireRole roles={["ADMIN", "ENGINEER"]}>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> New Template
            </button>
          </RequireRole>
        </div>

        {templates.length === 0 ? (
          <div className="card flex flex-col items-center justify-center text-center text-slate-400 py-16">
            <FileCog size={28} className="mb-2" />
            <p className="text-sm font-medium">No templates yet</p>
            <p className="text-xs">Save a config snippet here to reuse it from Deployments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-400">{t.description}</p>
                  </div>
                  <RequireRole roles={["ADMIN", "ENGINEER"]}>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </RequireRole>
                </div>
                <pre className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-600 overflow-x-auto max-h-32">
                  {t.content}
                </pre>
                {t.created_by_name && <p className="text-xs text-slate-400">Added by {t.created_by_name}</p>}
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Template" : "New Template"}
        width="max-w-xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.content}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Template
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Config content *</label>
            <textarea
              className="input font-mono h-40"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={"hostname Branch01\ninterface GigabitEthernet0/1\n description Finance LAN"}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
