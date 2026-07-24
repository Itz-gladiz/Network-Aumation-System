import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, PlugZap, Loader2 } from "lucide-react";
import Topbar from "../components/Topbar";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import RequireRole from "../components/RequireRole";
import { devicesApi } from "../api/devices";



const emptyForm = {
  hostname: "",
  network: "",
  ip_address: "",
  device_type: "MIKROTIK_ROUTER",
  username: "",
  password: "",
  enable_password: "",
  ssh_port: 22,
};

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);

  

useEffect(() => {
  loadDevices();
}, []);

async function loadDevices() {
  try {
    const { data } = await devicesApi.list();
    setDevices(data.results ?? data);
  } catch (err) {
    console.error(err);
  }
}

  const filtered = devices.filter((d) => {
    const matchesSearch =
      d.hostname.toLowerCase().includes(search.toLowerCase()) || d.ip_address.includes(search);
    const matchesType = typeFilter === "ALL" || d.device_type === typeFilter;
    return matchesSearch && matchesType;
  });

  function openAddModal() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(device) {
    setForm({ ...emptyForm, ...device, password: "", enable_password: "" });
    setEditingId(device.id);
    setModalOpen(true);
  }

  async function handleSave() {
  setSaving(true);

  try {
    let response;

    if (editingId) {
      response = await devicesApi.update(editingId, form);

      setDevices((prev) =>
        prev.map((d) =>
          d.id === editingId ? response.data : d
        )
      );
    } else {
      response = await devicesApi.create(form);

      setDevices((prev) => [
        response.data,
        ...prev,
      ]);
    }

    setModalOpen(false);
    setForm(emptyForm);
  } catch (err) {
    console.error(err);

    alert(
      JSON.stringify(
        err.response?.data,
        null,
        2
      )
    );
  } finally {
    setSaving(false);
  }
}

  async function handleDelete(id) {
    if (!confirm("Delete this device? This cannot be undone.")) return;
    try {
      await devicesApi.remove(id);
    } finally {
      setDevices((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function handleTestConnection(id) {
    setTestingId(id);
    try {
      const { data } = await devicesApi.testConnection(id);
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: data.status } : d)));
    } catch {
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: "OFFLINE" } : d)));
    } finally {
      setTestingId(null);
    }
  }

  const columns = [
    {
    key: "hostname",
    header: "Hostname",
    render: (d) => (
      <span className="font-medium text-brand-600">
        {d.hostname}
      </span>
    ),
  },

  {
    key: "network",
    header: "Network",
  },

  {
    key: "ip_address",
    header: "IP Address",
  },

  {
    key: "device_type",
    header: "Type",
    render: (d) => deviceTypeLabel(d.device_type),
  },

  {
    key: "status",
    header: "Status",
    render: (d) => <StatusBadge status={d.status} />,
  },

  {
    key: "last_backup",
    header: "Last Backup",
    render: (d) =>
      d.last_backup
        ? new Date(d.last_backup).toLocaleString()
        : "—",
  },

    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTestConnection(d.id)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            title="Test connection"
          >
            {testingId === d.id ? <Loader2 size={15} className="animate-spin" /> : <PlugZap size={15} />}
          </button>
          <RequireRole roles={["ADMIN", "ENGINEER"]}>
            <button onClick={() => openEditModal(d)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Edit">
              <Pencil size={15} />
            </button>
          </RequireRole>
          <RequireRole roles={["ADMIN"]}>
            <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500" title="Delete">
              <Trash2 size={15} />
            </button>
          </RequireRole>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Devices" subtitle={`${devices.length} registered devices`} />

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <input
              className="input w-64"
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="CISCO_ROUTER">Cisco Router</option>
              <option value="CISCO_SWITCH">Cisco Switch</option>
              <option value="MIKROTIK_ROUTER">MikroTik Router</option>
              <option value="MIKROTIK_SWITCH">MikroTik Switch</option>
              <option value="DDWRT_ROUTER">DD-WRT Router</option>
            </select>
          </div>
          <RequireRole roles={["ADMIN", "ENGINEER"]}>
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} /> Add Device
            </button>
          </RequireRole>
        </div>

        <DataTable columns={columns} rows={filtered} />
      </main>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Device" : "Add Device"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Device
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
         <Field
  label="Hostname *"
  value={form.hostname}
  onChange={(v) => setForm({ ...form, hostname: v })}
/>

<Field
    label="Network / Customer *"
    value={form.network}
    onChange={(v) =>
        setForm({
            ...form,
            network: v,
        })
    }
    placeholder="Customer A"
/>

<Field
  label="IP Address *"
  value={form.ip_address}
  onChange={(v) => setForm({ ...form, ip_address: v })}
/>
          <div>
            <label className="label">Device Type *</label>
            <select className="input" value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })}>
              <option value="CISCO_ROUTER">Cisco Router</option>
              <option value="CISCO_SWITCH">Cisco Switch</option>
              <option value="MIKROTIK_ROUTER">MikroTik Router</option>
              <option value="MIKROTIK_SWITCH">MikroTik Switch</option>
              <option value="DDWRT_ROUTER">DD-WRT Router</option>
            </select>
          </div>
          <Field label="SSH Port" type="number" value={form.ssh_port} onChange={(v) => setForm({ ...form, ssh_port: v })} />
          <Field label="Username *" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
          <Field label="Password *" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={editingId ? "Leave blank to keep current" : ""} />
          <Field label="Enable Password" type="password" value={form.enable_password} onChange={(v) => setForm({ ...form, enable_password: v })} />
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const DEVICE_TYPE_LABELS = {
  CISCO_ROUTER: "Cisco Router",
  CISCO_SWITCH: "Cisco Switch",
  MIKROTIK_ROUTER: "MikroTik Router",
  MIKROTIK_SWITCH: "MikroTik Switch",
  DDWRT_ROUTER: "DD-WRT Router",
};

function deviceTypeLabel(type) {
  return DEVICE_TYPE_LABELS[type] || type;
}
