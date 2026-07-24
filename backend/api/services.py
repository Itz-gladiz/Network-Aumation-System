import logging

logger = logging.getLogger(__name__)

# --- Vendor profiles ---------------------------------------------------
# To support a new vendor: add one entry here. Nothing else in the codebase
# needs to change — DeviceConnection and every view that touches a device
# (test_connection, backup, deploy) reads its behaviour from this table.
#
#   netmiko_type   -> driver string Netmiko understands
#   backup_cmd     -> command that prints the full running configuration
#   check_cmd      -> cheap command used for the "Test Connection" health check
#   supports_enable-> whether the device needs a `secret`/enable password to reach privileged mode
#   supports_save  -> whether a separate "write to memory" step exists (Cisco does; RouterOS
#                     and most Linux-based firmware like DD-WRT apply changes immediately)
VENDOR_PROFILES = {
    "CISCO_ROUTER": {
        "netmiko_type": "cisco_ios",
        "backup_cmd": "show running-config",
        "check_cmd": "show version",
        "supports_enable": True,
        "supports_save": True,
    },
    "CISCO_SWITCH": {
        "netmiko_type": "cisco_ios",
        "backup_cmd": "show running-config",
        "check_cmd": "show version",
        "supports_enable": True,
        "supports_save": True,
    },
    "MIKROTIK_ROUTER": {
        "netmiko_type": "mikrotik_routeros",
        "backup_cmd": "/export",
        "check_cmd": "/system resource print",
        "supports_enable": False,
        "supports_save": False,
    },
    "MIKROTIK_SWITCH": {
        "netmiko_type": "mikrotik_routeros",
        "backup_cmd": "/export",
        "check_cmd": "/system resource print",
        "supports_enable": False,
        "supports_save": False,
    },
    "DDWRT_ROUTER": {
        # DD-WRT is Linux/BusyBox under the hood — no config mode, no enable password.
        # Its entire configuration lives in NVRAM: `nvram show` dumps it all, and any
        # change made with `nvram set key=value` needs `nvram commit` to persist.
        "netmiko_type": "linux",
        "backup_cmd": "nvram show",
        "check_cmd": "uname -a",
        "supports_enable": False,
        "supports_save": False,
    },
}

DEFAULT_PROFILE = VENDOR_PROFILES["CISCO_ROUTER"]


def profile_for(device):
    return VENDOR_PROFILES.get(device.device_type, DEFAULT_PROFILE)


def netmiko_type_for(device):
    return profile_for(device)["netmiko_type"]


def backup_command_for(device):
    return profile_for(device)["backup_cmd"]


def check_command_for(device):
    return profile_for(device)["check_cmd"]


def supports_enable(device):
    return profile_for(device)["supports_enable"]


def supports_save(device):
    return profile_for(device)["supports_save"]


class DeviceConnection:
    """
    Context manager wrapping a Netmiko SSH session to a Device instance.
    Vendor differences (driver, enable mode) are resolved via VENDOR_PROFILES above,
    so this class itself never needs to change when a new vendor is added.

    Usage:
        with DeviceConnection(device) as conn:
            output = conn.send_command(backup_command_for(device))
    """

    def __init__(self, device):
        self.device = device
        self.conn = None

    def __enter__(self):
        try:
            from netmiko import ConnectHandler
            from netmiko.exceptions import NetmikoTimeoutException, NetmikoAuthenticationException
        except ImportError as exc:
            logger.error("Netmiko dependency missing from the environment.")
            raise RuntimeError("netmiko is not installed. Run: pip install netmiko") from exc

        profile = profile_for(self.device)
        netmiko_type = profile["netmiko_type"]

        connection_params = {
    "device_type": netmiko_type,
    "host": self.device.ip_address,
    "username": self.device.username,
    "password": self.device.password,
    "port": int(self.device.ssh_port or 22),
    "timeout": 30,
    "conn_timeout": 30,
    "banner_timeout": 30,
    "session_log": "netmiko.log",
        }

        if profile["supports_enable"]:
            connection_params["secret"] = self.device.enable_password or ""

        try:
            logger.info(f"Initiating Netmiko SSH connection to {self.device.ip_address} ({netmiko_type})...")
            self.conn = ConnectHandler(**connection_params)

            if profile["supports_enable"] and self.device.enable_password:
                logger.info(f"Sending enable command for {self.device.ip_address}")
                self.conn.enable()

            return self.conn

        except (NetmikoTimeoutException, NetmikoAuthenticationException) as net_err:
            logger.error(f"Netmiko failed to connect to {self.device.ip_address}: {str(net_err)}")
            raise RuntimeError(f"Network Connection Failed: {str(net_err)}")
        except Exception as e:
            logger.error(f"Unexpected connection exception for {self.device.ip_address}: {str(e)}")
            raise RuntimeError(f"Internal connection block: {str(e)}")

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn is not None:
            try:
                self.conn.disconnect()
                logger.info(f"Successfully disconnected SSH session from {self.device.ip_address}")
            except Exception:
                pass
