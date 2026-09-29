import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, status
from app.config import settings

class InMemoryRateLimiter:
    """Sliding-window in-memory rate limiter per user."""
    def __init__(self):
        self._user_requests: Dict[int, List[float]] = defaultdict(list)

    def check_rate_limit(self, user_id: int, max_requests: int = 15, window_seconds: int = 60):
        now = time.time()
        timestamps = self._user_requests[user_id]
        
        # Remove timestamps outside the active window
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        self._user_requests[user_id] = valid_timestamps
        
        if len(valid_timestamps) >= max_requests:
            retry_after = int(window_seconds - (now - valid_timestamps[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for AI operations. Please wait {retry_after} seconds before trying again.",
                headers={"Retry-After": str(retry_after)}
            )
            
        self._user_requests[user_id].append(now)

rate_limiter = InMemoryRateLimiter()
