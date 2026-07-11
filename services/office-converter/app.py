from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

app = FastAPI(title="ModelCanvas Office Converter", docs_url=None, redoc_url=None)

MAX_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", "25000000"))
TIMEOUT_SECONDS = int(os.getenv("CONVERSION_TIMEOUT_SECONDS", "45"))
ALLOWED_EXTENSIONS = {".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx", ".odt", ".ods", ".odp"}


def safe_name(value: str) -> str:
    name = Path(value).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", name)[:160]
    return cleaned or "document.bin"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "converter": "libreoffice"}


@app.post("/convert")
async def convert(file: UploadFile = File(...)) -> FileResponse:
    filename = safe_name(file.filename or "document.bin")
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Unsupported office extension: {extension or 'missing'}")

    workspace = Path(tempfile.mkdtemp(prefix="modelcanvas-office-"))
    source = workspace / filename
    total = 0
    try:
        with source.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_BYTES:
                    raise HTTPException(413, f"File exceeds {MAX_BYTES} bytes")
                destination.write(chunk)

        profile = workspace / "profile"
        result = subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--nologo",
                "--nodefault",
                "--nolockcheck",
                f"-env:UserInstallation=file://{profile}",
                "--convert-to",
                "pdf",
                "--outdir",
                str(workspace),
                str(source),
            ],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            check=False,
            env={"HOME": str(workspace), "PATH": os.environ.get("PATH", "")},
        )
        output = workspace / f"{source.stem}.pdf"
        if result.returncode != 0 or not output.exists():
            detail = (result.stderr or result.stdout or "conversion failed").strip()[-1000:]
            raise HTTPException(422, detail)
        return FileResponse(
            output,
            media_type="application/pdf",
            filename=f"{source.stem}.pdf",
            background=BackgroundTask(shutil.rmtree, workspace, ignore_errors=True),
        )
    except subprocess.TimeoutExpired as exc:
        shutil.rmtree(workspace, ignore_errors=True)
        raise HTTPException(504, "Office conversion timed out") from exc
    except HTTPException:
        shutil.rmtree(workspace, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(workspace, ignore_errors=True)
        raise HTTPException(500, "Office conversion failed") from exc
