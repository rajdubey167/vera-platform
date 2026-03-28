from fastapi import APIRouter, Depends
from app.services.neo4j_service import get_graph
from app.utils.security import get_current_user

router = APIRouter(tags=["Graph"])


@router.get("/graph")
def get_data_graph(current_user=Depends(get_current_user)):
    return get_graph()
