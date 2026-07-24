from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import ActivityLog, Backup, ConfigTemplate, Device, User


class Command(BaseCommand):
    help = "Seeds demo users, devices, backups and logs so the frontend has data to show."

    def handle(self, *args, **options):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(username="admin", email="admin@example.com", password="admin12345", role="ADMIN")
            self.stdout.write(self.style.SUCCESS("Created admin user  ->  admin / admin12345"))

        if not User.objects.filter(username="engineer").exists():
            User.objects.create_user(username="engineer", password="engineer12345", role="ENGINEER")
            self.stdout.write(self.style.SUCCESS("Created engineer user  ->  engineer / engineer12345"))

        if not User.objects.filter(username="viewer").exists():
            User.objects.create_user(username="viewer", password="viewer12345", role="VIEWER")
            self.stdout.write(self.style.SUCCESS("Created viewer user  ->  viewer / viewer12345"))

        demo_devices = [
            ("CORE-R1", "192.168.1.1", "CISCO_ROUTER", "ONLINE"),
            ("CORE-R2", "192.168.1.2", "CISCO_ROUTER", "ONLINE"),
            ("DIST-SW1", "192.168.1.3", "CISCO_SWITCH", "ONLINE"),
            ("BRANCH-R1", "192.168.2.1", "MIKROTIK_ROUTER", "OFFLINE"),
            ("BRANCH-SW1", "192.168.2.2", "CISCO_SWITCH", "ONLINE"),
            ("HOME-GW1", "192.168.4.1", "DDWRT_ROUTER", "ONLINE"),
        ]
        admin = User.objects.get(username="admin")
        for hostname, ip, dtype, dstatus in demo_devices:
            device, created = Device.objects.get_or_create(
                ip_address=ip,
                defaults=dict(
                    hostname=hostname, device_type=dtype, username="netadmin",
                    password="ChangeMe123!", ssh_port=22, status=dstatus,
                    last_backup=timezone.now(),
                ),
            )
            if created:
                Backup.objects.create(device=device, status="SUCCESS", size_kb=42.5, git_commit_hash="a1b2c3d")
                ActivityLog.objects.create(user=admin, action="Backup", target=hostname, status="Success", details="Backup completed")

        demo_templates = [
            ("Branch router baseline", "Standard hostname + LAN description for new branch routers",
             "hostname Branch01\ninterface GigabitEthernet0/1\n description Finance LAN"),
            ("Access switch VLAN setup", "Creates a standard access VLAN on a Cisco switch",
             "vlan 20\n name Access-VLAN\ninterface range GigabitEthernet0/1-24\n switchport mode access\n switchport access vlan 20"),
        ]
        for name, description, content in demo_templates:
            ConfigTemplate.objects.get_or_create(
                name=name, defaults=dict(description=description, content=content, created_by=admin)
            )

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
