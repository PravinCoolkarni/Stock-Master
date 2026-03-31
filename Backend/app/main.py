from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.DB.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.Controller.company_extractor import router as company_extractor_router 
from app.Controller.auth import router as auth_router
from app.Controller.market_research import router as market_research_router
from app.Model import blocked_token, research_message, research_session, user  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

# Define the list of allowed origins.
# You can add the specific ports your frontend runs on.
origins = [
    "http://localhost",
    "http://localhost:3000",  # Common for React
    "http://localhost:8080",  # Common for Vue/Angular
    "http://localhost:5173",  # Common for Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(company_extractor_router)
app.include_router(market_research_router)
    
