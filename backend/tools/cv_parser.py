import fitz  # PyMuPDF


class CVParseError(Exception):
    """Raised when CV extraction fails."""
    pass


def extract_cv_text(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF CV given its raw bytes."""
    if not pdf_bytes or len(pdf_bytes) < 10:
        raise CVParseError("The uploaded file is empty or too small to be a valid PDF.")
    
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        raise CVParseError("The uploaded file is not a valid PDF. Please upload a .pdf file.")
    
    try:
        full_text = ""
        for page in doc:
            full_text += page.get_text()
    except Exception as e:
        raise CVParseError(f"Failed to read content from the PDF: {str(e)}")
    finally:
        doc.close()
    
    text = full_text.strip()
    if len(text) < 50:
        raise CVParseError("Could not extract enough text from the PDF. Is it a scanned image? Please use a text-based PDF.")
    
    return text
