from django.urls import path, re_path

from imprint import views

urlpatterns = [
    path("healthz", views.HealthView.as_view()),
    path("readyz", views.ReadyView.as_view()),
    path("api/config", views.ConfigView.as_view()),
    # Same address as the Worker route GET /api/projects/:id (the Worker validates the id format the same way).
    re_path(r"^api/projects/(?P<project_id>prj_[^/]+)$", views.ProjectDetailView.as_view()),
    re_path(r"^api/", views.api_not_found),
]

handler404 = "imprint.errors.not_found_handler"
handler500 = "imprint.errors.server_error_handler"
