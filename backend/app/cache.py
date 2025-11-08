# Cache service - Redis if available, otherwise in-memory
from typing import Optional, Any
import json
import hashlib
import asyncio
import logging
from app.config import ENVIRONMENT

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.info("Redis not available, using in-memory cache")

_memory_cache = {}
_cache_timestamps = {}

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.use_redis = False
        self._user_keys = {}  # user_id -> set of key hashes
        self._key_to_user = {}  # key_hash -> user_id (for cleanup)
        
    async def connect(self):
        if REDIS_AVAILABLE:
            try:
                import os
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = await redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
                await self.redis_client.ping()
                self.use_redis = True
                logger.info("Connected to Redis cache")
            except Exception as e:
                logger.warning(f"Redis unavailable, using in-memory cache: {e}")
                self.use_redis = False
        else:
            logger.info("Redis not installed, using in-memory cache")
            self.use_redis = False
    
    def _make_key(self, prefix: str, user_id: str, *args) -> str:
        key_data = f"{prefix}:{user_id}:" + ":".join(str(arg) for arg in args)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        
        # Track this key for this user
        if user_id not in self._user_keys:
            self._user_keys[user_id] = set()
        self._user_keys[user_id].add(key_hash)
        self._key_to_user[key_hash] = user_id
        
        return key_hash
    
    async def get(self, key: str) -> Optional[Any]:
        if self.use_redis and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.warning(f"Redis get failed for key {key}, falling back to memory: {e}")
        else:
            if key in _memory_cache:
                timestamp = _cache_timestamps.get(key, 0)
                current_time = asyncio.get_event_loop().time()
                if timestamp > current_time:
                    return _memory_cache[key]
                else:
                    # Key expired - clean up
                    del _memory_cache[key]
                    del _cache_timestamps[key]
                    # Clean up tracking
                    user_id = self._key_to_user.pop(key, None)
                    if user_id and user_id in self._user_keys:
                        self._user_keys[user_id].discard(key)
                        if not self._user_keys[user_id]:
                            self._user_keys.pop(user_id, None)
        return None
    
    async def set(self, key: str, value: Any, ttl_seconds: int = 300):
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.setex(
                    key,
                    ttl_seconds,
                    json.dumps(value, default=str)
                )
                return
            except Exception as e:
                logger.warning(f"Redis set failed for key {key}, using memory cache: {e}")
        
        _memory_cache[key] = value
        current_time = asyncio.get_event_loop().time()
        _cache_timestamps[key] = current_time + ttl_seconds
    
    async def delete(self, key: str):
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete failed for key {key}: {e}")
        else:
            _memory_cache.pop(key, None)
            _cache_timestamps.pop(key, None)
        
        # Clean up tracking
        user_id = self._key_to_user.pop(key, None)
        if user_id and user_id in self._user_keys:
            self._user_keys[user_id].discard(key)
            if not self._user_keys[user_id]:
                self._user_keys.pop(user_id, None)
    
    async def invalidate_user_cache(self, user_id: str):
        # Get all keys for this user from our tracking
        keys_to_delete = list(self._user_keys.get(user_id, set()))
        
        if not keys_to_delete:
            return
        
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.delete(*keys_to_delete)
            except Exception as e:
                logger.warning(f"Redis cache invalidation failed for user {user_id}: {e}")
        else:
            # In-memory cache invalidation
            for key in keys_to_delete:
                _memory_cache.pop(key, None)
                _cache_timestamps.pop(key, None)
        
        # Clean up tracking
        for key in keys_to_delete:
            self._key_to_user.pop(key, None)
        self._user_keys.pop(user_id, None)

cache_service = CacheService()

