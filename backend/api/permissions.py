from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role == "ADMIN")


class IsEngineerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.role in ("ADMIN", "ENGINEER"))


class ViewerReadOnly(BasePermission):
    """Viewers can only read; Admins/Engineers get full access."""

    def has_permission(self, request, view):
        if request.user and request.user.role == "VIEWER":
            return request.method in SAFE_METHODS
        return True
