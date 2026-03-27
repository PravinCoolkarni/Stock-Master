import yfinance as yf
import json

def get_ticker_for_company(company_name):
    # Search for the company name
    search = yf.Search(company_name, news_count=0)   

    if search.quotes:
        return [
            {"name": quote.get("shortname"), "symbol": quote.get("symbol"),}
            for quote in search.quotes
        ]
    return None

def get_news_for_ticker(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)
    news = ticker.news
    return news