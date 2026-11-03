import re
import urllib.parse

try:
    import pymupdf as fitz  # PyMuPDF 2.x+
except ImportError:
    import fitz  # PyMuPDF 1.x fallback


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


RESERVED_GITHUB_PATHS = {
    "features", "topics", "orgs", "settings", "login", "pricing",
    "about", "marketplace", "explore", "sponsors", "search", "pulls",
    "issues", "notifications", "contact", "security", "customer-stories",
}

THIRD_PARTY_DOMAINS = {
    "github.com", "linkedin.com", "credly.com", "coursera.org", "udemy.com",
    "edx.org", "kaggle.com", "leetcode.com", "hackerrank.com", "medium.com",
    "youtube.com", "facebook.com", "instagram.com", "twitter.com", "x.com",
    "wa.me", "google.com", "rozee.pk", "mustakbil.com", "indeed.com",
    "stackoverflow.com", "bitbucket.org", "gitlab.com",
}


def _matches_domain(host: str, domain: str) -> bool:
    """Return True only when host equals domain or is a subdomain of domain."""
    return host == domain or host.endswith(f".{domain}")


def extract_cv_links(pdf_bytes: bytes, cv_text: str = "") -> dict:
    """Extract embedded PDF hyperlinks and text-based URLs/usernames from a CV."""
    found_urls = []

    # 1. Extract URI annotations from PDF document pages
    if pdf_bytes and len(pdf_bytes) >= 10:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            try:
                for page in doc:
                    try:
                        for link in page.get_links():
                            uri = link.get("uri")
                            if uri and isinstance(uri, str) and uri.strip().startswith(("http://", "https://")):
                                found_urls.append(uri.strip())
                    except Exception:
                        pass
            finally:
                doc.close()
        except Exception:
            pass

    # 2. Extract plain text URLs from cv_text
    if cv_text:
        # Match standard URLs
        for m in re.finditer(r"https?://[^\s<>()\"'\]]+", cv_text):
            found_urls.append(m.group(0))
        # Match bare github.com URLs e.g. github.com/username
        for m in re.finditer(r"(?:^|[\s(])((?:www\.)?github\.com/[A-Za-z0-9_.-]+)", cv_text):
            found_urls.append(f"https://{m.group(1)}")

    # 3. Clean and deduplicate URLs
    clean_urls = []
    seen = set()
    for raw in found_urls:
        u = raw.rstrip(".,;):\"'>")
        if u and u not in seen:
            seen.add(u)
            clean_urls.append(u)
        if len(clean_urls) >= 25:
            break

    # 4. Resolve github_username and portfolio_url
    github_username = None
    portfolio_url = None

    for u in clean_urls:
        try:
            parsed = urllib.parse.urlparse(u)
            host = (parsed.hostname or "").lower().removeprefix("www.")
            path = parsed.path.strip("/")
        except Exception:
            continue

        if not host:
            continue

        # Check GitHub username strictly on github.com/<handle>
        if not github_username and host == "github.com" and path:
            parts = [p for p in path.split("/") if p]
            if parts:
                candidate = parts[0]
                if re.match(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$", candidate):
                    if candidate.lower() not in RESERVED_GITHUB_PATHS:
                        github_username = candidate

        # Check portfolio URL (first personal domain outside third-party platforms; allows *.github.io)
        if not portfolio_url:
            is_third_party = any(_matches_domain(host, tp) for tp in THIRD_PARTY_DOMAINS)
            if not is_third_party:
                portfolio_url = u

    return {
        "all_links": clean_urls,
        "github_username": github_username,
        "portfolio_url": portfolio_url,
    }

