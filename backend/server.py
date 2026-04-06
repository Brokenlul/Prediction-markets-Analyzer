from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="ProbabilityOS API Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com"
POLYMARKET_CLOB_API = "https://clob.polymarket.com"
KALSHI_API = "https://api.elections.kalshi.com/trade-api/v2"

async def fetch_url(url: str, headers: dict = None):
    """Fetch URL with proper headers"""
    default_headers = {
        "User-Agent": "ProbabilityOS/1.0",
        "Accept": "application/json",
    }
    if headers:
        default_headers.update(headers)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=default_headers)
        response.raise_for_status()
        return response.json()

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ProbabilityOS API Proxy"}

@app.get("/api/polymarket/markets")
async def get_polymarket_markets(
    active: bool = True,
    limit: int = 500,
    order: str = "volume24hr",
    ascending: bool = False
):
    """Proxy for Polymarket Gamma API markets endpoint"""
    url = f"{POLYMARKET_GAMMA_API}/markets?active={str(active).lower()}&limit={limit}&order={order}&ascending={str(ascending).lower()}"
    try:
        data = await fetch_url(url)
        return data
    except Exception as e:
        return {"error": str(e), "markets": []}

@app.get("/api/polymarket/prices-history")
async def get_polymarket_prices_history(
    market: str,
    interval: str = "1h",
    fidelity: int = 60
):
    """Proxy for Polymarket CLOB API prices history"""
    url = f"{POLYMARKET_CLOB_API}/prices-history?market={market}&interval={interval}&fidelity={fidelity}"
    try:
        data = await fetch_url(url)
        return data
    except Exception as e:
        return {"error": str(e), "history": []}

@app.get("/api/kalshi/markets")
async def get_kalshi_markets(
    status: str = "open",
    limit: int = 200
):
    """Proxy for Kalshi API markets endpoint"""
    url = f"{KALSHI_API}/markets?status={status}&limit={limit}"
    try:
        data = await fetch_url(url)
        return data
    except Exception as e:
        return {"error": str(e), "markets": []}

@app.get("/api/kalshi/markets/{ticker}")
async def get_kalshi_market(ticker: str):
    """Get specific Kalshi market"""
    url = f"{KALSHI_API}/markets/{ticker}"
    try:
        data = await fetch_url(url)
        return data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
