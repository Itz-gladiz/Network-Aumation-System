from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    ActivityLogViewSet,
    BackupViewSet,
    ChangePasswordView,
    ConfigTemplateViewSet,
    DashboardSummaryView,
    DeploymentViewSet,
    DeviceViewSet,
    MeView,
    SystemSettingsView,
    UserViewSet,
)

router = DefaultRouter()
router.register("devices", DeviceViewSet, basename="device")
router.register("backups", BackupViewSet, basename="backup")
router.register("deployments", DeploymentViewSet, basename="deployment")
router.register("logs", ActivityLogViewSet, basename="log")
router.register("templates", ConfigTemplateViewSet, basename="template")
router.register("users", UserViewSet, basename="user")


urlpatterns = [
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("settings/", SystemSettingsView.as_view(), name="system-settings"),
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("", include(router.urls)),
]