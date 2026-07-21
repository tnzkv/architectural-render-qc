from fastapi import APIRouter

from .. import taxonomy

router = APIRouter(tags=["meta"])


@router.get("/meta/taxonomy")
def get_taxonomy():
    return {
        "element_types": taxonomy.ELEMENT_TYPES,
        "error_types": taxonomy.ERROR_TYPES,
        "review_statuses": taxonomy.REVIEW_STATUSES,
    }
