from django.contrib.auth.models import AbstractUser
from django.db import models

from .fields import EncryptedCharField


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Administrator"
        ENGINEER = "ENGINEER", "Network Engineer"
        VIEWER = "VIEWER", "Viewer"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class Device(models.Model):

    class DeviceType(models.TextChoices):
        CISCO_ROUTER = "CISCO_ROUTER", "Cisco Router"
        CISCO_SWITCH = "CISCO_SWITCH", "Cisco Switch"
        MIKROTIK_ROUTER = "MIKROTIK_ROUTER", "MikroTik Router"
        MIKROTIK_SWITCH = "MIKROTIK_SWITCH", "MikroTik Switch"
        DDWRT_ROUTER = "DDWRT_ROUTER", "DD-WRT Router"

    class Status(models.TextChoices):
        ONLINE = "ONLINE", "Online"
        OFFLINE = "OFFLINE", "Offline"
        UNKNOWN = "UNKNOWN", "Unknown"

    hostname = models.CharField(max_length=100)

    # ADD IT HERE
    network = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Customer or Network name",
    )

    ip_address = models.GenericIPAddressField()

    device_type = models.CharField(
        max_length=20,
        choices=DeviceType.choices,
    )

    username = models.CharField(max_length=100)

    password = EncryptedCharField(max_length=500)

    enable_password = EncryptedCharField(
        max_length=500,
        blank=True,
        null=True,
    )

    ssh_port = models.PositiveIntegerField(default=22)

    group = models.CharField(max_length=100, blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNKNOWN,
    )

    last_backup = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["hostname"]
        constraints = [
            models.UniqueConstraint(
                fields=["network", "ip_address"],
                name="unique_ip_per_network",
            )
        ]

    def __str__(self):
        return f"{self.hostname} ({self.network or 'No Network'})"

class Backup(models.Model):

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="backups",
    )

    file_path = models.CharField(
        max_length=500,
        blank=True,
    )

    git_commit_hash = models.CharField(
        max_length=40,
        blank=True,
    )

    size_kb = models.FloatField(default=0)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
    )

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.device.hostname} - {self.created_at:%Y-%m-%d %H:%M}"


class Deployment(models.Model):

    class Source(models.TextChoices):
        UPLOAD = "UPLOAD", "Upload File"
        COMMANDS = "COMMANDS", "Enter Commands"
        TEMPLATE = "TEMPLATE", "Use Template"

    devices = models.ManyToManyField(
        Device,
        related_name="deployments",
    )

    config_source = models.CharField(
        max_length=20,
        choices=Source.choices,
    )

    config_content = models.TextField()

    save_config = models.BooleanField(default=True)

    backup_before_deploy = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Deployment #{self.id}"


class DeploymentResult(models.Model):

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    deployment = models.ForeignKey(
        Deployment,
        on_delete=models.CASCADE,
        related_name="results",
    )

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
    )

    output = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device.hostname} - {self.status}"


class ActivityLog(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    action = models.CharField(max_length=50)

    target = models.CharField(max_length=200)

    status = models.CharField(max_length=20)

    details = models.CharField(
        max_length=255,
        blank=True,
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.action} - {self.target}"


class ConfigTemplate(models.Model):

    name = models.CharField(max_length=150)

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    content = models.TextField()

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


def log_activity(user, action, target, status, details=""):
    return ActivityLog.objects.create(
        user=user,
        action=action,
        target=target,
        status=status,
        details=details,
    )


class SystemSettings(models.Model):

    ssh_timeout_seconds = models.PositiveIntegerField(default=20)

    backup_retention_days = models.PositiveIntegerField(default=90)

    default_save_config = models.BooleanField(default=True)

    default_backup_before_deploy = models.BooleanField(default=True)

    email_alerts_on_failure = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "System Settings"