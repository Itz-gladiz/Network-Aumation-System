# api/management/commands/clear_demo.py
from django.core.management.base import BaseCommand
from api.models import ActivityLog, Backup, ConfigTemplate, Deployment, DeploymentResult, Device, User


class Command(BaseCommand):
    help = "Removes all demo/seeded data — devices, backups, deployments, logs, templates, and the demo users."

    def handle(self, *args, **options):
        DeploymentResult.objects.all().delete()
        Deployment.objects.all().delete()
        Backup.objects.all().delete()
        Device.objects.all().delete()
        ConfigTemplate.objects.all().delete()
        ActivityLog.objects.all().delete()

        deleted_users, _ = User.objects.filter(
            username__in=["admin", "engineer", "viewer"]
        ).delete()

        self.stdout.write(self.style.SUCCESS(f"Demo data cleared ({deleted_users} demo users removed)."))