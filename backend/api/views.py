from datetime import timedelta
import os
from django.db.models import Count, Q
from django.utils import timezone
from django.db.models.functions import TruncDate
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ActivityLog, Backup, ConfigTemplate, Deployment, DeploymentResult, Device, SystemSettings, User, log_activity
from .permissions import IsAdmin, IsEngineerOrAdmin, ViewerReadOnly
from .serializers import (
    ActivityLogSerializer,
    AdminUserSerializer,
    BackupSerializer,
    ChangePasswordSerializer,
    ConfigTemplateSerializer,
    DeploymentSerializer,
    DeviceSerializer,
    RegisterSerializer,
    SystemSettingsSerializer,
    UserSerializer,
)
from .services import DeviceConnection, backup_command_for, check_command_for, supports_save
from django.http import FileResponse, Http404

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        # Only email is editable here — username/role changes go through Admin/Users management.
        serializer = UserSerializer(request.user, data={"email": request.data.get("email", request.user.email)}, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        log_activity(user, "Password Change", user.username, "Success", "Self-service password change")
        return Response({"detail": "Password updated."})


class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Everyone can view system settings; only Admins can change them.
        if self.request.method == "PATCH":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        return Response(SystemSettingsSerializer(SystemSettings.load()).data)

    def patch(self, request):
        settings_obj = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_activity(request.user, "Settings Updated", "System Settings", "Success")
        return Response(serializer.data)

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all().order_by("hostname")
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated, ViewerReadOnly]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "network",
        "device_type",
        "status",
        "group",
    ]

    search_fields = [
        "hostname",
        "network",
        "ip_address",
    ]

    ordering_fields = [
        "hostname",
        "network",
        "created_at",
    ]

    ordering = ["hostname"]

    def perform_create(self, serializer):
        device = serializer.save()

        log_activity(
            self.request.user,
            "Device Added",
            device.hostname,
            "Success",
        )

    def perform_update(self, serializer):
        device = serializer.save()

        log_activity(
            self.request.user,
            "Device Updated",
            device.hostname,
            "Success",
        )

    def perform_destroy(self, instance):
        hostname = instance.hostname

        instance.delete()

        log_activity(
            self.request.user,
            "Device Deleted",
            hostname,
            "Success",
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, IsEngineerOrAdmin],
    )
    def test_connection(self, request, pk=None):

        device = self.get_object()

        try:
            with DeviceConnection(device) as conn:

                conn.send_command(
                    check_command_for(device),
                    read_timeout=8,
                )

            device.status = Device.Status.ONLINE
            device.save(update_fields=["status"])

            log_activity(
                request.user,
                "Connectivity Test",
                device.hostname,
                "Success",
            )

            return Response({
                "status": device.status,
            })

        except Exception as exc:

            device.status = Device.Status.OFFLINE
            device.save(update_fields=["status"])

            log_activity(
                request.user,
                "Connectivity Test",
                device.hostname,
                "Failed",
                str(exc),
            )

            return Response(
                {
                    "status": device.status,
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

class BackupViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Backup.objects.select_related(
        "device"
    ).all()

    serializer_class = BackupSerializer


    permission_classes = [
        IsAuthenticated,
        ViewerReadOnly
    ]


    filter_backends = [
        DjangoFilterBackend
    ]


    filterset_fields = [
        "device",
        "status"
    ]



    def get_serializer_context(self):

        return {
            "request": self.request
        }



    # ===============================
    # BACKUP MULTIPLE DEVICES
    # ===============================

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[
            IsAuthenticated,
            IsEngineerOrAdmin
        ]
    )
    def backup_selected(self, request):

        device_ids = request.data.get(
            "device_ids",
            []
        )


        devices = Device.objects.filter(
            id__in=device_ids
        )


        created = []


        for device in devices:

            backup = self._run_backup(
                device,
                request.user
            )

            created.append(
                backup.id
            )


        return Response(
            {
                "created_backups": created
            },
            status=status.HTTP_201_CREATED
        )



    # ===============================
    # RUN SINGLE DEVICE BACKUP
    # ===============================

    def _run_backup(
        self,
        device,
        user
    ):

        try:

            command = backup_command_for(
                device
            )


            with DeviceConnection(device) as conn:

                output = conn.send_command(
                    command
                )



            backup_folder = "backups"


            os.makedirs(
                backup_folder,
                exist_ok=True
            )


            filename = (
                f"{device.hostname}_"
                f"{timezone.now().strftime('%Y%m%d_%H%M%S')}.txt"
            )


            filepath = os.path.join(
                backup_folder,
                filename
            )


            with open(
                filepath,
                "w",
                encoding="utf-8"
            ) as file:

                file.write(output)



            backup = Backup.objects.create(

                device=device,

                file_path=filepath,

                size_kb=(
                    len(output.encode())
                    /
                    1024
                ),

                status=Backup.Status.SUCCESS

            )



            device.last_backup = timezone.now()

            device.status = Device.Status.ONLINE


            device.save(
                update_fields=[
                    "last_backup",
                    "status"
                ]
            )



            log_activity(
                user,
                "BACKUP",
                device.hostname,
                "SUCCESS"
            )



        except Exception as exc:


            backup = Backup.objects.create(

                device=device,

                status=Backup.Status.FAILED,

                error_message=str(exc)

            )


            device.status = Device.Status.OFFLINE


            device.save(
                update_fields=[
                    "status"
                ]
            )



            log_activity(
                user,
                "BACKUP",
                device.hostname,
                "FAILED",
                str(exc)
            )


        return backup



    # ===============================
    # DOWNLOAD BACKUP FILE
    # URL:
    # GET /api/backups/{id}/download/
    # ===============================

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[
            IsAuthenticated
        ],
        url_path="download"
    )
    def download(
        self,
        request,
        pk=None
    ):


        backup = self.get_object()



        if not backup.file_path:

            return Response(
                {
                    "error":
                    "No backup file available"
                },
                status=404
            )



        if not os.path.exists(
            backup.file_path
        ):

            return Response(
                {
                    "error":
                    "Backup file missing on server"
                },
                status=404
            )



        filename = os.path.basename(
            backup.file_path
        )



        return FileResponse(

            open(
                backup.file_path,
                "rb"
            ),

            as_attachment=True,

            filename=filename

        )



    # ===============================
    # RESTORE BACKUP
    # ===============================

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[
            IsAuthenticated,
            IsEngineerOrAdmin
        ]
    )
    def restore(
        self,
        request,
        pk=None
    ):


        return Response(
            {
                "detail":
                "Restore requires Git integration."
            },
            status=501
        )

class DeploymentViewSet(viewsets.ModelViewSet):
    queryset = Deployment.objects.prefetch_related("devices", "results").all()
    serializer_class = DeploymentSerializer
    permission_classes = [IsAuthenticated, IsEngineerOrAdmin]
    http_method_names = ["get", "post", "head"]

    @action(detail=False, methods=["post"])
    def deploy_now(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        deployment = serializer.save(created_by=request.user)

        for device in deployment.devices.all():
            self._deploy_to_device(deployment, device, request.user)

        log_activity(request.user, "Deployment", f"{deployment.devices.count()} Devices", "Success")
        return Response({"deployment_id": deployment.id}, status=status.HTTP_201_CREATED)

    def _deploy_to_device(self, deployment, device, user):
        try:
            with DeviceConnection(device) as conn:
                lines = deployment.config_content.splitlines()
                output = conn.send_config_set(lines)
                if deployment.save_config and supports_save(device):
                    conn.save_config()
            DeploymentResult.objects.create(deployment=deployment, device=device, status="SUCCESS", output=output)
        except Exception as exc:
            DeploymentResult.objects.create(deployment=deployment, device=device, status="FAILED", output=str(exc))


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related("user").all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["action", "status", "user"]


class UserViewSet(viewsets.ModelViewSet):
    """Admin-only user management — add/remove team members, change roles, deactivate accounts."""

    queryset = User.objects.all().order_by("username")
    permission_classes = [IsAuthenticated, IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head"]

    def get_serializer_class(self):
        return RegisterSerializer if self.action == "create" else AdminUserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log_activity(self.request.user, "User Added", user.username, "Success")

    def perform_update(self, serializer):
        user = serializer.save()
        log_activity(self.request.user, "User Updated", user.username, "Success")

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError("You can't delete your own account.")
        username = instance.username
        instance.delete()
        log_activity(self.request.user, "User Deleted", username, "Success")


class ConfigTemplateViewSet(viewsets.ModelViewSet):
    """Reusable config snippets — selectable from the Deployments page's 'Use Template' option."""

    queryset = ConfigTemplate.objects.all()
    serializer_class = ConfigTemplateSerializer
    permission_classes = [IsAuthenticated, ViewerReadOnly]

    def perform_create(self, serializer):
        template = serializer.save(created_by=self.request.user)
        log_activity(self.request.user, "Template Added", template.name, "Success")

    def perform_destroy(self, instance):
        name = instance.name
        instance.delete()
        log_activity(self.request.user, "Template Deleted", name, "Success")


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)

        total = Device.objects.count()
        online = Device.objects.filter(status=Device.Status.ONLINE).count()

        top_devices = (
            Backup.objects.filter(created_at__gte=week_ago)
            .values("device__hostname")
            .annotate(backups=Count("id"))
            .order_by("-backups")[:5]
        )

        trend_rows = (
            DeploymentResult.objects.filter(created_at__gte=week_ago)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(
                successful=Count("id", filter=Q(status="SUCCESS")),
                failed=Count("id", filter=Q(status="FAILED")),
            )
            .order_by("day")
        )
        deployment_trend = [
            {"date": row["day"].strftime("%b %d"), "successful": row["successful"], "failed": row["failed"]}
            for row in trend_rows
        ]

        return Response({
            "total_devices": total,
            "online_devices": online,
            "offline_devices": total - online,
            "backups_last_7_days": Backup.objects.filter(created_at__gte=week_ago).count(),
            "deployments_last_7_days": Deployment.objects.filter(created_at__gte=week_ago).count(),
            "recent_activity": ActivityLogSerializer(
                ActivityLog.objects.order_by("-timestamp")[:5], many=True
            ).data,
            "top_devices_by_backup": [
                {"device": d["device__hostname"], "backups": d["backups"]} for d in top_devices
            ],
            "deployment_trend": deployment_trend,
        })