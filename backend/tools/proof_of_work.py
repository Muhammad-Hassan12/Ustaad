"""
Unified Proof-of-Work Auditor (GitHub Profile & Personal Portfolio Website).
Lightweight, SSRF-guarded inspector using Python stdlib and httpx.
Zero heavy headless browsers, zero extra search credits, bounded to <=4.0s.
"""

import asyncio
from datetime import datetime, timezone
import html.parser
import ipaddress
import logging
import os
import re
import socket
import urllib.parse
from typing import Optional

import httpx

logger = logging.getLogger("ustaad.tools.proof_of_work")

MAX_HTML_BYTES = 512 * 1024  # 512 KB cap

_GITHUB_HANDLE_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")
_RESERVED_GITHUB_PATHS = {
    "features", "topics", "orgs", "settings", "login", "pricing",
    "about", "marketplace", "explore", "sponsors", "search", "pulls",
    "issues", "notifications", "contact", "security", "customer-stories",
}


def validate_public_http_url(raw_url: str) -> str:
    """
    Strict SSRF Guard: Validates that a URL is a valid public HTTP/HTTPS endpoint.
    Blocks localhost, private networks, CGNAT, cloud metadata (169.254.x.x), loopbacks,
    IPv4-mapped IPv6 private ranges, credentials in URLs, non-standard ports, and non-http(s) schemes.
    """
    raw = (raw_url or "").strip()
    if not raw:
        raise ValueError("URL cannot be empty.")

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        raw = f"https://{raw}"

    parsed = urllib.parse.urlparse(raw)
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        raise ValueError(f"Disallowed scheme '{scheme}'. Only HTTP and HTTPS are permitted.")

    if parsed.username or parsed.password:
        raise ValueError("Credentials in portfolio URLs are disallowed.")

    if parsed.port and parsed.port not in (80, 443):
        raise ValueError(f"Disallowed port '{parsed.port}'. Only standard ports 80/443 are permitted.")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise ValueError("URL must include a valid hostname.")

    # Reject obvious private hostnames
    if hostname in ("localhost", "ip6-localhost", "ip6-loopback") or hostname.endswith(
        (".local", ".internal", ".localhost", ".onion")
    ):
        raise ValueError(f"Disallowed private host '{hostname}'.")

    # Resolve hostname to IP addresses and verify public global routability
    try:
        addrinfo = socket.getaddrinfo(
            hostname,
            parsed.port or (443 if scheme == "https" else 80),
            proto=socket.IPPROTO_TCP,
        )
    except socket.gaierror as e:
        raise ValueError(f"DNS resolution failed for '{hostname}': {str(e)}")

    if not addrinfo:
        raise ValueError(f"No IP addresses resolved for '{hostname}'.")

    for entry in addrinfo:
        sockaddr = entry[4]
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            raise ValueError(f"Invalid resolved IP '{ip_str}'.")

        ip_check = ip.ipv4_mapped if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped else ip
        if (
            not ip_check.is_global
            or ip_check.is_private
            or ip_check.is_loopback
            or ip_check.is_link_local
            or ip_check.is_multicast
            or ip_check.is_reserved
            or ip_check.is_unspecified
        ):
            raise ValueError(f"Target address {ip_str} resolves to a non-public or reserved network.")

    return raw


class _PortfolioHTMLParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.title: Optional[str] = None
        self.meta_description: Optional[str] = None
        self.og_title: Optional[str] = None
        self.og_image: Optional[str] = None
        self.headings: list[str] = []
        self.links: list[str] = []
        self.has_mailto = False
        self.has_tel = False
        self.has_contact_link = False
        self.has_github = False
        self.has_linkedin = False

        self._in_title = False
        self._in_heading = False
        self._current_heading: list[str] = []
        self._skip_depth = 0
        self._visible_chars = 0

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}

        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._skip_depth += 1
            return

        if tag_lower == "title":
            self._in_title = True
        elif tag_lower in ("h1", "h2") and len(self.headings) < 6:
            self._in_heading = True
            self._current_heading = []
        elif tag_lower == "meta":
            name = attr_dict.get("name", "").lower()
            prop = attr_dict.get("property", "").lower()
            content = attr_dict.get("content", "").strip()
            if content:
                if name == "description" and not self.meta_description:
                    self.meta_description = content[:250]
                elif prop == "og:title" and not self.og_title:
                    self.og_title = content[:150]
                elif prop == "og:description" and not self.meta_description:
                    self.meta_description = content[:250]
                elif prop == "og:image" and not self.og_image:
                    self.og_image = content[:300]
        elif tag_lower == "a":
            href = attr_dict.get("href", "").strip()
            if href:
                href_lower = href.lower()
                if href_lower.startswith("mailto:"):
                    self.has_mailto = True
                elif href_lower.startswith("tel:"):
                    self.has_tel = True
                if "contact" in href_lower or "wa.me/" in href_lower:
                    self.has_contact_link = True
                if "github.com" in href_lower:
                    self.has_github = True
                if "linkedin.com" in href_lower:
                    self.has_linkedin = True
                if len(self.links) < 20:
                    self.links.append(href)

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            if self._skip_depth > 0:
                self._skip_depth -= 1
        elif tag_lower == "title":
            self._in_title = False
        elif tag_lower in ("h1", "h2"):
            if self._in_heading:
                heading_text = " ".join("".join(self._current_heading).split()).strip()
                if heading_text and len(heading_text) <= 120 and heading_text not in self.headings:
                    self.headings.append(heading_text)
                self._in_heading = False
                self._current_heading = []

    def handle_data(self, data):
        if self._skip_depth > 0:
            return
        cleaned = data.strip()
        if not cleaned:
            return

        self._visible_chars += len(cleaned)

        if self._in_title and not self.title:
            self.title = cleaned[:120]
        elif self._in_heading:
            self._current_heading.append(data)


async def _fetch_portfolio_body(current_url: str, headers: dict) -> tuple[Optional[int], str, Optional[str], str]:
    hops = 0
    status_code: Optional[int] = None
    body_text = ""
    non_html_type: Optional[str] = None
    async with httpx.AsyncClient(timeout=3.5, follow_redirects=False, verify=True) as client:
        while hops < 3:
            hops += 1
            async with client.stream("GET", current_url, headers=headers) as resp:
                status_code = resp.status_code

                if status_code in (301, 302, 303, 307, 308):
                    loc = resp.headers.get("Location")
                    if not loc:
                        break
                    next_url = urllib.parse.urljoin(current_url, loc)
                    # Re-validate redirect target against SSRF before following!
                    current_url = await asyncio.to_thread(validate_public_http_url, next_url)
                    continue

                content_type = (resp.headers.get("content-type") or "").lower()
                if content_type and content_type.startswith(
                    ("application/pdf", "image/", "video/", "audio/", "application/octet-stream", "application/zip")
                ):
                    non_html_type = content_type.split(";")[0].strip()
                    break

                # Stream and cap HTML response strictly at MAX_HTML_BYTES (512 KB)
                content_chunks: list[bytes] = []
                total = 0
                async for chunk in resp.aiter_bytes():
                    content_chunks.append(chunk)
                    total += len(chunk)
                    if total >= MAX_HTML_BYTES:
                        break
                raw_bytes = b"".join(content_chunks)[:MAX_HTML_BYTES]
                body_text = raw_bytes.decode(resp.encoding or "utf-8", errors="replace")
                break
    return status_code, body_text, non_html_type, current_url


async def inspect_portfolio_url(raw_url: str) -> dict:
    """
    Inspects a candidate portfolio URL with SSRF protection, manual redirect validation,
    streamed 512 KB memory capping, and HTML structure parsing. Bounded to <=4.0 seconds.
    """
    clean_target = (raw_url or "").strip()
    if clean_target and not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", clean_target):
        clean_target = f"https://{clean_target}"

    try:
        current_url = await asyncio.to_thread(validate_public_http_url, clean_target)
    except ValueError as e:
        return {
            "status": "blocked_url",
            "url": clean_target,
            "canonical_url": clean_target,
            "http_status": None,
            "uses_https": clean_target.startswith("https://"),
            "title": None,
            "meta_description": None,
            "og_image": None,
            "has_open_graph": False,
            "is_empty_spa_shell": False,
            "has_github_link": False,
            "has_linkedin_link": False,
            "has_contact_cta": False,
            "headings": [],
            "headings_sample": [],
            "audit_findings": [f"Invalid or restricted portfolio URL: {str(e)}"],
        }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Ustaad-CareerOS/2.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    status_code: Optional[int] = None
    body_text = ""
    non_html_type: Optional[str] = None

    try:
        status_code, body_text, non_html_type, current_url = await asyncio.wait_for(
            _fetch_portfolio_body(current_url, headers),
            timeout=4.0,
        )
    except (asyncio.TimeoutError, TimeoutError):
        return {
            "status": "unreachable",
            "url": clean_target,
            "canonical_url": clean_target,
            "http_status": None,
            "uses_https": clean_target.startswith("https://"),
            "title": None,
            "meta_description": None,
            "og_image": None,
            "has_open_graph": False,
            "is_empty_spa_shell": False,
            "has_github_link": False,
            "has_linkedin_link": False,
            "has_contact_cta": False,
            "headings": [],
            "headings_sample": [],
            "audit_findings": ["Portfolio audit timed out (4.0s limit exceeded)."],
        }
    except ValueError as e:
        return {
            "status": "blocked_url",
            "url": current_url,
            "canonical_url": current_url,
            "http_status": status_code,
            "uses_https": current_url.startswith("https://"),
            "title": None,
            "meta_description": None,
            "og_image": None,
            "has_open_graph": False,
            "is_empty_spa_shell": False,
            "has_github_link": False,
            "has_linkedin_link": False,
            "has_contact_cta": False,
            "headings": [],
            "headings_sample": [],
            "audit_findings": [f"Portfolio redirect blocked for security: {str(e)}"],
        }
    except Exception as e:
        logger.warning("Portfolio inspection failed for '%s': %s", current_url, e)
        return {
            "status": "unreachable",
            "url": current_url,
            "canonical_url": current_url,
            "http_status": status_code,
            "uses_https": current_url.startswith("https://"),
            "title": None,
            "meta_description": None,
            "og_image": None,
            "has_open_graph": False,
            "is_empty_spa_shell": False,
            "has_github_link": False,
            "has_linkedin_link": False,
            "has_contact_cta": False,
            "headings": [],
            "headings_sample": [],
            "audit_findings": [f"Portfolio website could not be reached ({type(e).__name__}). Check that your domain and DNS are active."],
        }

    is_https = current_url.startswith("https://")
    if non_html_type:
        return {
            "status": "http_error",
            "url": current_url,
            "canonical_url": current_url,
            "http_status": status_code,
            "uses_https": is_https,
            "title": None,
            "meta_description": None,
            "og_image": None,
            "has_open_graph": False,
            "is_empty_spa_shell": False,
            "has_github_link": False,
            "has_linkedin_link": False,
            "has_contact_cta": False,
            "headings": [],
            "headings_sample": [],
            "audit_findings": [f"Portfolio URL returned non-HTML content ({non_html_type}). Provide your live portfolio webpage URL instead of a static file."],
        }

    # Parse HTML structure
    parser = _PortfolioHTMLParser()
    try:
        parser.feed(body_text)
    except Exception:
        pass

    findings = []
    if not is_https:
        findings.append("Portfolio is served over unencrypted HTTP. Add an SSL certificate (Let's Encrypt / Vercel HTTPS).")

    has_og = bool(parser.og_title or parser.og_image or parser.meta_description)
    if not has_og:
        findings.append("Missing OpenGraph social preview tags (og:title, og:image). Links shared on LinkedIn/WhatsApp will appear plain.")

    title_lower = (parser.title or "").lower()
    is_default_title = any(
        df in title_lower
        for df in ("vite + react", "create next app", "react app", "my app", "untitled")
    )
    is_empty_spa = (
        parser._visible_chars < 120
        and ('id="root"' in body_text or 'id="app"' in body_text or is_default_title)
    )

    if is_default_title:
        findings.append(f"Default framework title detected ('{parser.title}'). Update <title> to your name and engineering role.")

    if is_empty_spa:
        findings.append("Client-side SPA shell detected with minimal prerendered text. Search engines & recruiter scrapers may see an empty page.")

    if not parser.has_github:
        findings.append("No GitHub link detected on the homepage. Link your GitHub profile so hiring teams can inspect your source code.")

    has_contact_cta = bool(
        parser.has_mailto
        or parser.has_tel
        or parser.has_contact_link
        or any("contact" in h.lower() for h in parser.headings)
    )
    if not has_contact_cta:
        findings.append("No clear email or contact CTA detected. Add a prominent 'mailto:' or contact button.")

    if status_code and status_code >= 400:
        findings.append(f"Server returned HTTP status {status_code}.")

    return {
        "status": "ok" if (status_code and status_code < 400) else "http_error",
        "url": current_url,
        "canonical_url": current_url,
        "http_status": status_code,
        "uses_https": is_https,
        "title": parser.title,
        "meta_description": parser.meta_description,
        "og_image": parser.og_image,
        "has_open_graph": has_og,
        "is_empty_spa_shell": is_empty_spa,
        "has_github_link": parser.has_github,
        "has_linkedin_link": parser.has_linkedin,
        "has_contact_cta": has_contact_cta,
        "headings": parser.headings,
        "headings_sample": parser.headings,
        "audit_findings": findings,
    }


def _extract_github_handle(username_or_url: str) -> str:
    """Safely normalize a GitHub handle or URL into a clean username candidate."""
    raw = (username_or_url or "").strip()
    if not raw:
        return ""

    if "://" in raw or raw.lower().startswith(("github.com/", "www.github.com/")):
        parsed = urllib.parse.urlparse(raw if "://" in raw else f"https://{raw}")
        host = (parsed.hostname or "").lower().removeprefix("www.")
        if host == "github.com":
            parts = [p for p in parsed.path.strip("/").split("/") if p]
            return parts[0].lstrip("@").strip() if parts else ""
        return ""

    # Plain handle or user/repo shorthand: extract first path segment before any query/fragment
    cleaned = raw.split("?")[0].split("#")[0].strip().strip("/")
    if "/" in cleaned:
        cleaned = cleaned.split("/")[0]
    return cleaned.lstrip("@").strip()


async def inspect_github_profile(username_or_url: str) -> dict:
    """
    Inspects a candidate's GitHub profile and top public repositories.
    Uses free public GitHub API with strict handle validation. Bounded to <=4.0 seconds.
    """
    username = _extract_github_handle(username_or_url)
    if (
        not username
        or not _GITHUB_HANDLE_RE.match(username)
        or username.lower() in _RESERVED_GITHUB_PATHS
    ):
        return {
            "status": "invalid_username",
            "username": username[:40],
            "profile_url": None,
            "html_url": None,
            "audit_findings": ["Invalid GitHub username or URL supplied."],
        }

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Ustaad-CareerOS/2.1",
    }
    github_token = os.getenv("GITHUB_TOKEN", "").strip()
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    user_data = None
    repos_data = []
    default_profile_url = f"https://github.com/{username}"

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            user_resp, repos_resp = await asyncio.gather(
                client.get(f"https://api.github.com/users/{username}", headers=headers),
                client.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=12", headers=headers),
                return_exceptions=True,
            )

        if isinstance(user_resp, httpx.Response):
            if user_resp.status_code == 404:
                return {
                    "status": "not_found",
                    "username": username,
                    "profile_url": default_profile_url,
                    "html_url": default_profile_url,
                    "audit_findings": [f"GitHub user '@{username}' was not found. Verify your username handle."],
                }
            if user_resp.status_code in (403, 429):
                return {
                    "status": "rate_limited",
                    "username": username,
                    "profile_url": default_profile_url,
                    "html_url": default_profile_url,
                    "audit_findings": ["GitHub API rate limit reached. Analysis skipped for this run."],
                }
            if user_resp.status_code == 200:
                user_data = user_resp.json()

        if isinstance(repos_resp, httpx.Response) and repos_resp.status_code == 200:
            parsed_repos = repos_resp.json()
            if isinstance(parsed_repos, list):
                repos_data = parsed_repos

    except Exception as e:
        logger.warning("GitHub audit failed for user '%s': %s", username, e)
        return {
            "status": "unreachable",
            "username": username,
            "profile_url": default_profile_url,
            "html_url": default_profile_url,
            "audit_findings": [f"Could not reach GitHub API ({type(e).__name__})."],
        }

    if not isinstance(user_data, dict):
        return {
            "status": "unreachable",
            "username": username,
            "profile_url": default_profile_url,
            "html_url": default_profile_url,
            "audit_findings": ["GitHub user profile could not be retrieved."],
        }

    # Analyze repositories and activity
    public_repos_count = user_data.get("public_repos", 0)
    followers = user_data.get("followers", 0)
    bio = user_data.get("bio")
    blog = user_data.get("blog")
    display_name = user_data.get("name")
    avatar_url = user_data.get("avatar_url")
    profile_url = user_data.get("html_url") or default_profile_url

    original_repos = [r for r in repos_data if isinstance(r, dict) and not r.get("fork", False)]
    languages: set[str] = set()
    repos_with_desc = 0
    repos_with_demo = 0
    repo_candidates = []
    has_recent_activity = False
    latest_push: Optional[str] = None
    now = datetime.now(timezone.utc)

    for r in original_repos:
        lang = r.get("language")
        if lang:
            languages.add(lang)

        desc = (r.get("description") or "").strip()
        if desc:
            repos_with_desc += 1

        homepage = (r.get("homepage") or "").strip()
        has_demo = bool(homepage and homepage.startswith(("http://", "https://")))
        if has_demo:
            repos_with_demo += 1

        pushed_at_str = r.get("pushed_at")
        if pushed_at_str:
            if not latest_push or pushed_at_str > latest_push:
                latest_push = pushed_at_str
            try:
                pushed_dt = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
                if (now - pushed_dt).days <= 90:
                    has_recent_activity = True
            except Exception:
                pass

        repo_url = r.get("html_url") or f"https://github.com/{username}/{r.get('name', '')}"
        stars = int(r.get("stargazers_count") or 0)
        repo_candidates.append({
            "name": r.get("name", ""),
            "language": lang,
            "stars": stars,
            "has_demo": has_demo,
            "homepage": homepage if has_demo else None,
            "pushed_at": pushed_at_str,
            "description": desc[:120] if desc else None,
            "url": repo_url,
            "html_url": repo_url,
        })

    # Prioritize repos with live demos, stars, and descriptions for standout showcase
    repo_candidates.sort(
        key=lambda item: (
            1 if item["has_demo"] else 0,
            item["stars"],
            1 if item["description"] else 0,
            item["pushed_at"] or "",
        ),
        reverse=True,
    )
    standout_repos = repo_candidates[:4]

    findings = []
    if public_repos_count == 0:
        findings.append("No public repositories found. Create at least 2 pinned projects showcasing your primary tech stack.")
    elif len(original_repos) == 0:
        findings.append("All recent public repos are forks. Add original engineering projects to demonstrate independent problem-solving.")
    else:
        if repos_with_desc < len(original_repos) * 0.6:
            findings.append("Multiple repositories lack a project description. Add a 1-sentence summary to each repo on GitHub.")
        if repos_with_demo == 0:
            findings.append("No live project deployment links found. Deploy at least 1 frontend/full-stack project to Vercel/Render and set the repo 'Website' URL.")
        if not has_recent_activity:
            findings.append("No commit activity detected in the last 90 days. Keep your commit streak active leading up to interviews.")

    return {
        "status": "ok",
        "username": username,
        "name": display_name,
        "avatar_url": avatar_url,
        "profile_url": profile_url,
        "html_url": profile_url,
        "public_repos": public_repos_count,
        "followers": followers,
        "bio": bio,
        "blog": blog,
        "top_languages": sorted(list(languages))[:5],
        "original_repos_checked": len(original_repos),
        "repos_with_description": repos_with_desc,
        "repos_with_live_demo": repos_with_demo,
        "active_within_90_days": has_recent_activity,
        "latest_push": latest_push,
        "standout_repos": standout_repos,
        "audit_findings": findings,
    }


async def run_proof_of_work_audit(
    github_username: Optional[str] = None,
    portfolio_url: Optional[str] = None,
    source: str = "cv_extracted",
) -> Optional[dict]:
    """
    Orchestrates concurrent GitHub and Portfolio audits, and formats a compact
    prompt digest (<=1,200 chars) for downstream Gap Analysis & CV Rewrite agents.
    """
    clean_gh = (github_username or "").strip()
    clean_port = (portfolio_url or "").strip()

    if not clean_gh and not clean_port:
        return None

    tasks = []
    if clean_gh:
        tasks.append(inspect_github_profile(clean_gh))
    if clean_port:
        tasks.append(inspect_portfolio_url(clean_port))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    github_res = None
    portfolio_res = None

    idx = 0
    if clean_gh:
        res = results[idx]
        github_res = res if isinstance(res, dict) else {"status": "error", "username": clean_gh[:40], "audit_findings": ["GitHub audit timed out."]}
        idx += 1

    if clean_port:
        res = results[idx]
        portfolio_res = res if isinstance(res, dict) else {"status": "error", "url": clean_port, "audit_findings": ["Portfolio audit timed out."]}

    # Build concise prompt digest
    digest_parts = []
    if github_res and github_res.get("status") == "ok":
        gh_langs = ", ".join(github_res.get("top_languages", [])) or "None detected"
        gh_demos = f"{github_res.get('repos_with_live_demo', 0)}/{github_res.get('original_repos_checked', 0)} repos have live demo links"
        gh_active = "Active within 90 days" if github_res.get("active_within_90_days") else "Inactive >90 days"
        digest_parts.append(
            f"GITHUB (@{github_res.get('username')}): {github_res.get('public_repos')} repos, Languages: [{gh_langs}], {gh_demos}, {gh_active}."
        )
        if github_res.get("audit_findings"):
            digest_parts.append(f"GitHub Gaps: {'; '.join(github_res['audit_findings'][:2])}")

    if portfolio_res and portfolio_res.get("status") == "ok":
        port_title = portfolio_res.get("title") or "Untitled"
        port_features = []
        if portfolio_res.get("uses_https"):
            port_features.append("HTTPS")
        if portfolio_res.get("has_open_graph"):
            port_features.append("OpenGraph tags")
        if portfolio_res.get("has_contact_cta"):
            port_features.append("Contact CTA")
        if portfolio_res.get("is_empty_spa_shell"):
            port_features.append("Empty SPA shell warning")
        digest_parts.append(
            f"PORTFOLIO ({portfolio_res.get('url')}): Title '{port_title}', Features: [{', '.join(port_features)}]."
        )
        if portfolio_res.get("audit_findings"):
            digest_parts.append(f"Portfolio Gaps: {'; '.join(portfolio_res['audit_findings'][:2])}")

    prompt_digest = "\n".join(digest_parts)[:1200]

    all_findings = []
    if github_res:
        all_findings.extend(github_res.get("audit_findings", []))
    if portfolio_res:
        all_findings.extend(portfolio_res.get("audit_findings", []))

    return {
        "source": source,
        "github": github_res,
        "portfolio": portfolio_res,
        "audit_findings": all_findings,
        "prompt_digest": prompt_digest,
    }
