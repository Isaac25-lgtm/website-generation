class ApiHeadersMiddleware:
    """Same API response headers as the Worker, plus `x-served-by: python` so the serving implementation is visible."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            response.headers["x-content-type-options"] = "nosniff"
            response.headers["referrer-policy"] = "strict-origin-when-cross-origin"
            if "cache-control" not in response.headers:
                response.headers["cache-control"] = "no-store"
        response.headers.pop("WWW-Authenticate", None)
        response.headers["x-served-by"] = "python"
        return response
