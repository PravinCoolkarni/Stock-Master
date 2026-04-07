import base64
import io

import requests
import trafilatura

from app.Schemas.document import Document


def get_context_from_url(url: str):
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
    }
    response = requests.get(url, headers=headers)
    text = trafilatura.extract(response.text)
    return text


def get_context_from_doc(docs: Document):
    file_bytes = base64.b64decode(docs.docData)
    file_buffer = io.BytesIO(file_bytes)

    if docs.docType.lower() == "pdf":
        try:
            import fitz  # PyMuPDF
        except ImportError as exc:
            raise RuntimeError("PDF support is not installed in this deployment.") from exc

        doc = fitz.open(stream=file_buffer, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    elif docs.docType.lower() == "docx" or docs.docType.lower() == "doc":
        try:
            from docx import Document as DocxDocument
        except ImportError as exc:
            raise RuntimeError("DOCX support is not installed in this deployment.") from exc

        doc = DocxDocument(file_buffer)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text

    elif docs.docType.lower() == "xlsx" or docs.docType.lower() == "xls":
        try:
            import pandas as pd
        except ImportError as exc:
            raise RuntimeError("Excel support is not installed in this deployment.") from exc

        df = pd.read_excel(file_buffer)
        text = df.to_string()
        return text

    else:
        return "Unsupported document type."


def get_context_from_raw_text(rawText: str):
    return rawText
