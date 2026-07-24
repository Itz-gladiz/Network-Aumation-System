from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import ActivityLog, Backup, ConfigTemplate, Deployment, DeploymentResult, Device, SystemSettings, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_active", "date_joined"]
        read_only_fields = ["username", "role", "is_active", "date_joined"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            "ssh_timeout_seconds", "backup_retention_days",
            "default_save_config", "default_backup_before_deploy",
            "email_alerts_on_failure", "updated_at",
        ]
        read_only_fields = ["updated_at"]




class DeviceSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    enable_password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Device
        fields = [
            "id",
            "hostname",
            "network",
            "ip_address",
            "device_type",
            "username",
            "password",
            "enable_password",
            "ssh_port",
            "group",
            "status",
            "last_backup",
            "created_at",
        ]

    def update(self, instance, validated_data):
        if not validated_data.get("password"):
            validated_data.pop("password", None)

        if not validated_data.get("enable_password"):
            validated_data.pop("enable_password", None)

        return super().update(instance, validated_data)
        

class BackupSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source="device.hostname", read_only=True)
    ip_address = serializers.CharField(source="device.ip_address", read_only=True)

    class Meta:
        model = Backup
        fields = [
            "id", "device", "device_name", "ip_address", "file_path",
            "git_commit_hash", "size_kb", "status", "error_message", "created_at",
        ]


class DeploymentResultSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source="device.hostname", read_only=True)

    class Meta:
        model = DeploymentResult
        fields = ["id", "device", "device_name", "status", "output", "created_at"]


class DeploymentSerializer(serializers.ModelSerializer):
    results = DeploymentResultSerializer(many=True, read_only=True)
    device_ids = serializers.PrimaryKeyRelatedField(
        source="devices", queryset=Device.objects.all(), many=True, write_only=True
    )

    class Meta:
        model = Deployment
        fields = [
            "id", "device_ids", "devices", "config_source", "config_content",
            "save_config", "backup_before_deploy", "created_by", "created_at", "results",
        ]
        read_only_fields = ["devices", "created_by"]


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "timestamp", "user", "user_name", "action", "target", "status", "details"]


class AdminUserSerializer(serializers.ModelSerializer):
    """Used by Admins on the Users page — unlike UserSerializer, role/is_active are writable."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_active", "date_joined"]
        read_only_fields = ["username", "date_joined"]


class ConfigTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = ConfigTemplate
        fields = ["id", "name", "description", "content", "created_by", "created_by_name", "created_at", "updated_at"]
        read_only_fields = ["created_by"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
