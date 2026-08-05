"""Small in-process rate limiter for authentication endpoints.

Use a shared store (Redis, API gateway, etc.) when running multiple workers.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int, namespace: str):
        self.limit = limit
        self.window_seconds = window_seconds
        self.namespace = namespace
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def __call__(self, request: Request) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{self.namespace}:{client}"
        now = monotonic()

        with self._lock:
            events = self._events[key]
            while events and now - events[0] >= self.window_seconds:
                events.popleft()
            if len(events) >= self.limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(self.window_seconds)},
                )
            events.append(now)


login_limiter = RateLimiter(limit=10, window_seconds=60, namespace="login")
registration_limiter = RateLimiter(limit=5, window_seconds=60 * 60, namespace="registration")
otp_limiter = RateLimiter(limit=5, window_seconds=10 * 60, namespace="otp")
password_reset_limiter = RateLimiter(limit=5, window_seconds=15 * 60, namespace="password-reset")
