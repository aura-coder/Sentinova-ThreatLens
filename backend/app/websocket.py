import asyncio
import json
import logging
import redis.asyncio as aioredis
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("New WebSocket connection established.")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("WebSocket connection closed.")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send message: {e}")

manager = ConnectionManager()

async def redis_listener():
    """
    Subscribes to the Redis 'alerts.stream' channel and broadcasts 
    incoming messages to all connected WebSockets.
    """
    redis = await aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.subscribe("alerts.stream")
    
    logger.info("WebSocket Gateway subscribed to Redis 'alerts.stream'")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await manager.broadcast(message["data"])
    except asyncio.CancelledError:
        logger.info("Redis listener task cancelled.")
    finally:
        await pubsub.unsubscribe("alerts.stream")
        await redis.close()
