import requests
import trafilatura
import fitz  # PyMuPDF
import base64
import io
import pandas as pd
from docx import Document as DocxDocument
from app.Schemas.document import Document



def get_context_from_url(url: str):
    headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    response = requests.get(url, headers=headers)
    text = trafilatura.extract(response.text)
    return text

def get_context_from_doc(docs: Document):
    # Step 1: Decode to bytes
    file_bytes = base64.b64decode(docs.docData)  # Assuming docs has an attribute 'fileContent' which is the base64 string
    # Step 2: Wrap in a memory buffer
    file_buffer = io.BytesIO(file_bytes)
    if(docs.docType.lower() == "pdf"):
        doc = fitz.open(stream=file_buffer, filetype="pdf")  # Open the document using PyMuPDF
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    elif(docs.docType.lower() == "docx" or docs.docType.lower() == "doc"):
        doc = DocxDocument(file_buffer)  # Open the document using python-docx
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    elif(docs.docType.lower() == "xlsx" or docs.docType.lower() == "xls"):
        df = pd.read_excel(file_buffer)
        text = df.to_string() 
        # Placeholder for TXT processing logic
        return text
    else:
        return "Unsupported document type."


def get_context_from_raw_text(rawText: str):
    # Placeholder for raw text processing logic
    return rawText