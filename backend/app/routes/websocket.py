from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.database import SessionLocal
from app.services.ws_manager import manager
from app.utils.security import get_user_from_token

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(...)):
    db = SessionLocal()
    try:
        try:
            current_user = get_user_from_token(token, db)
        except Exception:
            await websocket.close(code=1008, reason="Unauthorized")
            return

        if str(current_user.id) != user_id and current_user.role != "admin":
            await websocket.close(code=1008, reason="Forbidden")
            return

        await manager.connect(user_id, websocket)
        try:
            while True:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            manager.disconnect(user_id, websocket)
    finally:
        db.close()
