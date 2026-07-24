import { useEffect, useState } from "react";
import { UploadCloud, Loader2, Inbox } from "lucide-react";
import Topbar from "../components/Topbar";
import { deploymentsApi } from "../api/deployments";
import { devicesApi } from "../api/devices";
import { templatesApi } from "../api/templates";
import { mockDevices, mockTemplates } from "../mock/data";

export default function Deployments() {
  const [devices, setDevices] = useState([]);
  const [templates, setTemplates] = useState(mockTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selected, setSelected] = useState([]);
  const [source, setSource] = useState("UPLOAD");
  const [commands, setCommands] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [saveConfig, setSaveConfig] = useState(true);
  const [backupBefore, setBackupBefore] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    devicesApi.list().then(({ data }) => setDevices(data.results ?? data)).catch(() => {});
    templatesApi.list().then(({ data }) => setTemplates(data.results ?? data)).catch(() => {});
  }, []);

  function toggleDevice(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileContent(reader.result);
    reader.readAsText(file);
  }

  async function handleDeploy() {
    setDeploying(true);
    setResult(null);
    const selectedTemplate = templates.find((t) => t.id === Number(selectedTemplateId));
    const config_content = source === "COMMANDS" ? commands : source === "TEMPLATE" ? selectedTemplate?.content || "" : fileContent;
    try {
      const { data } = await deploymentsApi.deployNow({
        device_ids: selected,
        config_source: source,
        config_content,
        save_config: saveConfig,
        backup_before_deploy: backupBefore,
      });
      setResult({ ok: true, message: `Deployment #${data.deployment_id} queued for ${selected.length} device(s).` });
      setSelected([]);
    } catch {
      setResult({ ok: false, message: "Could not reach the backend — connect the API to run a real deployment." });
    } finally {
      setDeploying(false);
    }
  }

  const selectedDevices = devices.filter((d) => selected.includes(d.id));
  const canDeploy =
    selected.length > 0 &&
    (source === "COMMANDS" ? commands.trim() : source === "TEMPLATE" ? selectedTemplateId : fileContent.trim());

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title="Deploy Configuration" subtitle="Push configuration to one or more devices" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card space-y-5">
            <div>
              <label className="label">Select Devices</label>
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                {devices.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleDevice(d.id)} />
                    <span className="font-medium">{d.hostname}</span>
                    <span className="text-slate-400">({d.ip_address})</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Configuration Source</label>
              <div className="flex gap-4 text-sm">
                {[
                  ["UPLOAD", "Upload File"],
                  ["COMMANDS", "Enter Commands"],
                  ["TEMPLATE", "Use Template"],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="source" checked={source === val} onChange={() => setSource(val)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {source === "UPLOAD" && (
              <div>
                <label className="label">Upload Configuration File</label>
                <div className="flex items-center gap-3">
                  <label className="btn-secondary cursor-pointer">
                    Choose File
                    <input type="file" accept=".txt,.cfg,.conf" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <span className="text-sm text-slate-400">{fileName || "No file chosen"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Supported formats: .txt, .cfg, .conf</p>
              </div>
            )}

            {source === "COMMANDS" && (
              <div>
                <label className="label">Commands</label>
                <textarea
                  className="input font-mono h-32"
                  placeholder={"hostname Branch01\ninterface GigabitEthernet0/1\ndescription Finance LAN"}
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                />
              </div>
            )}

            {source === "TEMPLATE" && (
              <div>
                <label className="label">Template</label>
                <select className="input" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  <option value="">Select a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No templates yet — create one on the Templates page.</p>
                )}
              </div>
            )}

            <div>
              <label className="label">Deployment Options</label>
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={saveConfig} onChange={(e) => setSaveConfig(e.target.checked)} />
                  Save Config (write memory)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={backupBefore} onChange={(e) => setBackupBefore(e.target.checked)} />
                  Backup before deploying
                </label>
              </div>
            </div>

            {result && (
              <p className={`text-sm px-3 py-2 rounded-lg ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {result.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button className="btn-secondary" onClick={() => setSelected([])}>Cancel</button>
              <button className="btn-primary" onClick={handleDeploy} disabled={!canDeploy || deploying}>
                {deploying ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                Deploy Now
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-3">Selected Devices ({selectedDevices.length})</h3>
            {selectedDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-slate-400 py-16">
                <Inbox size={28} className="mb-2" />
                <p className="text-sm font-medium">No devices selected</p>
                <p className="text-xs">Please select devices to deploy configuration</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {selectedDevices.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{d.hostname}</span>
                    <span className="text-slate-400">{d.ip_address}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
