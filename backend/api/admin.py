from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ActivityLog, Backup, ConfigTemplate, Deployment, DeploymentResult, Device, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + ((None, {"fields": ("role",)}),)
    list_display = ["username", "email", "role", "is_staff"]



@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ["hostname", "ip_address", "device_type", "status", "last_backup"]
    list_filter = ["device_type", "status"]
    search_fields = ["hostname", "ip_address"]


@admin.register(Backup)
class BackupAdmin(admin.ModelAdmin):
    list_display = ["device", "status", "size_kb", "created_at"]
    list_filter = ["status"]


@admin.register(Deployment)
class DeploymentAdmin(admin.ModelAdmin):
    list_display = ["id", "config_source", "created_by", "created_at"]


admin.site.register(DeploymentResult)
admin.site.register(ActivityLog)
admin.site.register(ConfigTemplate)
