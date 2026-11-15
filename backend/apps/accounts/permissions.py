from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    සාමාන්‍ය පරිශීලකයින්ට දත්ත බැලීමට (GET) පමණක් ඉඩ ලබා දෙන අතර,
    අලුතින් දත්ත දැමීමට හෝ මැකීමට (POST, PUT, DELETE) Admin (is_staff) කෙනෙකු විය යුතුය.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)