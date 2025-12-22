from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.router import router as api_router
from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.middleware import RequestLoggingMiddleware

# Setup logging before creating the app
setup_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="A template API built with FastAPI",
    version=settings.APP_VERSION,
)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} API"}


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} mode")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.APP_NAME}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.is_development,
    )
