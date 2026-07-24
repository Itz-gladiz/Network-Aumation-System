export const mockDevices = [
  { id: 1, hostname: "CORE-R1", ip_address: "192.168.1.1", device_type: "CISCO_ROUTER", status: "ONLINE", last_backup: "2026-07-16T10:30:00" },
  { id: 2, hostname: "CORE-R2", ip_address: "192.168.1.2", device_type: "CISCO_ROUTER", status: "ONLINE", last_backup: "2026-07-16T10:28:00" },
  { id: 3, hostname: "DIST-SW1", ip_address: "192.168.1.3", device_type: "CISCO_SWITCH", status: "ONLINE", last_backup: "2026-07-16T10:25:00" },
  { id: 4, hostname: "BRANCH-R1", ip_address: "192.168.2.1", device_type: "MIKROTIK_ROUTER", status: "OFFLINE", last_backup: "2026-07-15T09:15:00" },
  { id: 5, hostname: "BRANCH-SW1", ip_address: "192.168.2.2", device_type: "CISCO_SWITCH", status: "ONLINE", last_backup: "2026-07-15T10:18:00" },
  { id: 6, hostname: "BRANCH-R2", ip_address: "192.168.3.1", device_type: "MIKROTIK_ROUTER", status: "OFFLINE", last_backup: "2026-07-15T08:50:00" },
  { id: 7, hostname: "ACCESS-SW1", ip_address: "192.168.3.2", device_type: "CISCO_SWITCH", status: "ONLINE", last_backup: "2026-07-15T10:12:00" },
  { id: 8, hostname: "HOME-GW1", ip_address: "192.168.4.1", device_type: "DDWRT_ROUTER", status: "ONLINE", last_backup: "2026-07-15T09:40:00" },
];

export const mockBackups = [
  { id: 1, device: "CORE-R1", ip_address: "192.168.1.1", created_at: "2026-07-16T10:30:00", status: "SUCCESS", size_kb: 45.2, git_commit_hash: "a1b2c3d" },
  { id: 2, device: "CORE-R2", ip_address: "192.168.1.2", created_at: "2026-07-16T10:28:00", status: "SUCCESS", size_kb: 42.7, git_commit_hash: "d4e5f6g" },
  { id: 3, device: "DIST-SW1", ip_address: "192.168.1.3", created_at: "2026-07-16T10:25:00", status: "SUCCESS", size_kb: 38.9, git_commit_hash: "h7i8j9k" },
  { id: 4, device: "BRANCH-R1", ip_address: "192.168.2.1", created_at: "2026-07-16T10:20:00", status: "FAILED", size_kb: 0, git_commit_hash: "" },
  { id: 5, device: "CORE-R1", ip_address: "192.168.1.1", created_at: "2026-07-15T09:30:00", status: "SUCCESS", size_kb: 44.8, git_commit_hash: "l1m2n3o" },
];

export const mockLogs = [
  { id: 1, timestamp: "2026-07-16T10:30:00", user: "admin", action: "Backup", target: "CORE-R1", status: "Success", details: "Backup completed" },
  { id: 2, timestamp: "2026-07-16T10:28:00", user: "admin", action: "Deployment", target: "10 Devices", status: "Success", details: "Configuration deployed" },
  { id: 3, timestamp: "2026-07-16T10:25:00", user: "admin", action: "Backup", target: "DIST-SW1", status: "Success", details: "Backup completed" },
  { id: 4, timestamp: "2026-07-16T10:20:00", user: "admin", action: "Backup", target: "BRANCH-R1", status: "Failed", details: "Connection timeout" },
  { id: 5, timestamp: "2026-07-16T09:15:00", user: "admin", action: "Password Change", target: "5 Devices", status: "Success", details: "Password updated" },
];

export const mockDeploymentTrend = [
  { date: "Jul 10", successful: 22, failed: 3 },
  { date: "Jul 11", successful: 18, failed: 6 },
  { date: "Jul 12", successful: 25, failed: 2 },
  { date: "Jul 13", successful: 20, failed: 8 },
  { date: "Jul 14", successful: 27, failed: 4 },
  { date: "Jul 15", successful: 24, failed: 3 },
  { date: "Jul 16", successful: 30, failed: 2 },
];

export const mockTopDevicesByBackup = [
  { device: "CORE-R1", backups: 14 },
  { device: "CORE-R2", backups: 12 },
  { device: "DIST-SW1", backups: 10 },
  { device: "BRANCH-R1", backups: 9 },
  { device: "BRANCH-SW1", backups: 8 },
];

export const mockTemplates = [
  { id: 1, name: "Branch router baseline", description: "Standard hostname + LAN description for new branch routers", content: "hostname Branch01\ninterface GigabitEthernet0/1\n description Finance LAN", created_by_name: "admin" },
  { id: 2, name: "Access switch VLAN setup", description: "Creates a standard access VLAN on a Cisco switch", content: "vlan 20\n name Access-VLAN\ninterface range GigabitEthernet0/1-24\n switchport mode access\n switchport access vlan 20", created_by_name: "admin" },
];

export const mockUsers = [
  { id: 1, username: "admin", email: "admin@example.com", role: "ADMIN", is_active: true, date_joined: "2026-06-01T09:00:00" },
  { id: 2, username: "engineer", email: "", role: "ENGINEER", is_active: true, date_joined: "2026-06-10T09:00:00" },
  { id: 3, username: "viewer", email: "", role: "VIEWER", is_active: true, date_joined: "2026-06-12T09:00:00" },
];

export const mockSummary = {
  total_devices: 54,
  online_devices: 48,
  offline_devices: 6,
  backups_last_7_days: 128,
  deployments_last_7_days: 32,
};
