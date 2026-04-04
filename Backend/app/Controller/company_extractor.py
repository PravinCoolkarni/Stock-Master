from fastapi import APIRouter, HTTPException
from app.Services.company_extractor import get_ticker_for_company as get_ticker_service
from app.Services.company_extractor import get_company_overview as get_company_overview_service
from app.Services.company_extractor import get_stock_data as get_stock_data_service
from app.Services.company_extractor import get_news_for_ticker as get_news_service


router = APIRouter(prefix="/company", tags=["company"])

@router.get("/get_ticker/{company_name}")
def get_ticker_for_company(company_name: str):
    tickers = get_ticker_service(company_name)
    if tickers:
        return {"company_name": company_name, "tickers": tickers}
    raise HTTPException(status_code=404, detail=f"Ticker for '{company_name}' not found.")


@router.get("/overview/{ticker_symbol}")
def get_company_overview(ticker_symbol: str):
    overview = get_company_overview_service(ticker_symbol)
    if overview:
        return overview
    raise HTTPException(status_code=404, detail=f"Overview for '{ticker_symbol}' not found.")


@router.get("/stock/{ticker_symbol}")
def get_stock_data(ticker_symbol: str, output_size: str = "compact"):
    stock_data = get_stock_data_service(ticker_symbol, output_size)
    if stock_data:
        return stock_data
    raise HTTPException(status_code=404, detail=f"Stock data for '{ticker_symbol}' not found.")

@router.get("/get_news/{ticker_symbol}")
def get_news_for_ticker(ticker_symbol: str):
    news = get_news_service(ticker_symbol)
    if news:
        return {"ticker_symbol": ticker_symbol, "news": news}
    raise HTTPException(status_code=404, detail=f"News for '{ticker_symbol}' not found.")

