"""Error responses in the Worker's format: JSON `{"error": message, "code": code}`, `code` omitted when absent."""

import logging
import secrets

from django.http import JsonResponse
from rest_framework import exceptions, status
from rest_framework.response import Response

log = logging.getLogger("imprint")


class ApiError(exceptions.APIException):
    def __init__(self, status_code: int, message: str, code: str | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.error_code = code


def body(message: str, code: str | None = None) -> dict:
    return {"error": message, "code": code} if code else {"error": message}


def exception_handler(exc, context):
    if isinstance(exc, ApiError):
        return Response(body(exc.message, exc.error_code), status=exc.status_code)
    if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        return Response(body("Please sign in to continue.", "unauthenticated"), status=status.HTTP_401_UNAUTHORIZED)
    if isinstance(exc, exceptions.PermissionDenied):
        return Response(body("You don't have access to this.", "forbidden"), status=status.HTTP_403_FORBIDDEN)
    if isinstance(exc, exceptions.NotFound):
        return Response(body("Not found"), status=status.HTTP_404_NOT_FOUND)
    if isinstance(exc, exceptions.MethodNotAllowed):
        return Response(body("Method not allowed", "method_not_allowed"), status=status.HTTP_405_METHOD_NOT_ALLOWED)
    if isinstance(exc, (exceptions.ParseError, exceptions.ValidationError, exceptions.UnsupportedMediaType)):
        return Response(body("Some fields are invalid. Please check and try again.", "validation"), status=status.HTTP_400_BAD_REQUEST)
    if isinstance(exc, exceptions.Throttled):
        return Response(body("Too many requests. Please wait a moment and try again.", "rate_limited"), status=status.HTTP_429_TOO_MANY_REQUESTS)
    error_id = "err_" + secrets.token_hex(6)
    log.exception("Unhandled error %s", error_id)  # no request bodies or customer text in logs
    return Response({"error": "Something went wrong. Please try again.", "code": "internal", "errorId": error_id}, status=500)


def not_found_handler(request, exception=None):
    return JsonResponse(body("Not found"), status=404)


def server_error_handler(request):
    return JsonResponse({"error": "Something went wrong. Please try again.", "code": "internal"}, status=500)
