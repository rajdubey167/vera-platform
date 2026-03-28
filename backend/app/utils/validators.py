from fastapi import HTTPException, UploadFile

ALLOWED_EXTENSIONS = {"csv", "json"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def validate_file(file: UploadFile) -> str:
    """Validate file extension and return the extension."""
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only CSV and JSON files are allowed.",
        )
    return ext


async def validate_file_size(file: UploadFile) -> bytes:
    """Read file content and validate size."""
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is 50MB.",
        )
    return content
