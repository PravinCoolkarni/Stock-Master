import json
import random
import time
from typing import Callable, TypeVar

import yfinance as yf

T = TypeVar("T")

MAX_RETRIES = 4
BACKOFF_BASE_SECONDS = 1.5


def _retry_yfinance_call(call: Callable[[], T], operation: str) -> T:
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return call()
        except Exception as exc:
            last_error = exc
            message = str(exc).lower()
            retryable = "429" in message or "too many requests" in message or "rate limit" in message

            if not retryable or attempt == MAX_RETRIES:
                break

            delay = BACKOFF_BASE_SECONDS * attempt + random.uniform(0, 0.75)
            print(f"{operation} hit rate limiting on attempt {attempt}. Retrying in {delay:.2f}s")
            time.sleep(delay)

    if last_error:
        raise last_error

    raise RuntimeError(f"{operation} failed unexpectedly.")


def get_ticker_for_company(company_name):
    search = _retry_yfinance_call(
        lambda: yf.Search(company_name, news_count=0),
        f"Ticker search for {company_name}",
    )

    if search.quotes:
        return [
            {
                "name": quote.get("shortname") or quote.get("longname") or quote.get("symbol"),
                "symbol": quote.get("symbol"),
            }
            for quote in search.quotes
            if quote.get("symbol")
        ]
    return None


def get_company_overview(ticker_symbol: str):
    ticker = yf.Ticker(ticker_symbol)
    info = _retry_yfinance_call(
        lambda: ticker.info or {},
        f"Overview fetch for {ticker_symbol}",
    )
    print(
        f"Retrieved info for {ticker_symbol}:\n"
        f"{json.dumps(info, indent=2, default=str)}"
    )
    if not info:
        return None

    def _string(value):
        return "" if value is None else str(value)

    fifty_two_week_high = info.get("fiftyTwoWeekHigh")
    fifty_two_week_low = info.get("fiftyTwoWeekLow")
    fifty_two_week_range = ""
    if fifty_two_week_low is not None and fifty_two_week_high is not None:
        fifty_two_week_range = f"{fifty_two_week_low} - {fifty_two_week_high}"

    return {
        "longName": _string(info.get("longName") or info.get("shortName") or ticker_symbol),
        "symbol": _string(info.get("symbol") or ticker_symbol),
        "exchange": _string(info.get("exchange")),
        "currency": _string(info.get("currency")),
        "sectorDisp": _string(info.get("sectorDisp") or info.get("sector")),
        "industryDisp": _string(info.get("industryDisp") or info.get("industry")),
        "website": _string(info.get("website")),
        "city": _string(info.get("city")),
        "country": _string(info.get("country")),
        "fiftyTwoWeekRange": _string(fifty_two_week_range),
        "marketCap": _string(info.get("marketCap")),
        "volume": _string(info.get("volume") or info.get("regularMarketVolume")),
        "open": _string(info.get("open") or info.get("regularMarketOpen")),
        "previousClose": _string(info.get("previousClose") or info.get("regularMarketPreviousClose")),
        "dayLow": _string(info.get("dayLow") or info.get("regularMarketDayLow")),
        "dayHigh": _string(info.get("dayHigh") or info.get("regularMarketDayHigh")),
        "totalRevenue": _string(info.get("totalRevenue")),
        "ebitda": _string(info.get("ebitda")),
        "profitMargins": _string(info.get("profitMargins")),
        "grossMargins": _string(info.get("grossMargins")),
        "operatingMargins": _string(info.get("operatingMargins")),
        "revenueGrowth": _string(info.get("revenueGrowth")),
        "earningsGrowth": _string(info.get("earningsGrowth") or info.get("earningsQuarterlyGrowth")),
        "fiftyTwoWeekHigh": _string(fifty_two_week_high),
        "fiftyTwoWeekLow": _string(fifty_two_week_low),
    }


def get_stock_data(ticker_symbol: str, output_size: str = "compact"):
    period = "3mo" if output_size == "compact" else "1y"
    ticker = yf.Ticker(ticker_symbol)
    history = _retry_yfinance_call(
        lambda: ticker.history(period=period, interval="1d"),
        f"Price history fetch for {ticker_symbol}",
    )
    if history.empty:
        return []

    records = []
    sorted_history = history.sort_index(ascending=False).head(30 if output_size == "compact" else 365)
    for date, row in sorted_history.iterrows():
        records.append(
            {
                "symbol": ticker_symbol,
                "date": date.strftime("%Y-%m-%d"),
                "open": f"{row['Open']:.2f}",
                "high": f"{row['High']:.2f}",
                "low": f"{row['Low']:.2f}",
                "close": f"{row['Close']:.2f}",
                "volume": str(int(row["Volume"])),
            }
        )
    return records


def get_news_for_ticker(ticker_symbol):
    ticker = yf.Ticker(ticker_symbol)
    news = _retry_yfinance_call(
        lambda: ticker.news,
        f"News fetch for {ticker_symbol}",
    )
    return news
