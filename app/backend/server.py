"""FastAPI application entrypoint."""
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

import os
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from routers.auth import router as auth_router
from routers.shop import router as shop_router
from routers.customer import router as customer_router
from routers.admin import router as admin_router
from routers.support import router as support_router


logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("app")

app = FastAPI(title="Ecom Commerce API", version="1.0.0")

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
origins = [frontend_url, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health
@app.get("/api/")
async def root():
    return {"message": "Ecom Commerce API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Routers
app.include_router(auth_router)
app.include_router(shop_router)
app.include_router(customer_router)
app.include_router(admin_router)
app.include_router(support_router)

# Mount uploads dir
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.on_event("startup")
async def _startup():
    try:
        from seed import seed_all
        seed_all()
        logger.info("Startup complete: seed data written.")
    except Exception as e:
        logger.exception(f"Startup error: {e}")

@app.on_event("shutdown")
async def _shutdown():
    pass