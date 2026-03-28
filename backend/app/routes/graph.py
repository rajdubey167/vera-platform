from fastapi import APIRouter, Depends
from app.services.neo4j_service import get_graph, clear_all
from app.utils.security import get_current_user, require_admin

router = APIRouter(tags=["Graph"])


@router.get("/graph")
def get_data_graph(current_user=Depends(get_current_user)):
    user_id = None if current_user.role == "admin" else current_user.id
    return get_graph(user_id=user_id)


@router.delete("/graph/clear", dependencies=[Depends(require_admin)])
def clear_graph():
    clear_all()
    return {"message": "Neo4j cleared"}
