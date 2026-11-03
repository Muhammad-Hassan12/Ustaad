from io import BytesIO
from typing import Optional
from xml.sax.saxutils import escape as xml_escape
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def _esc(val: object, default: str = "") -> str:
    """Safely convert any value to ReportLab-safe escaped text (ASCII/Latin-safe for Helvetica)."""
    if val is None:
        return default
    text = str(val).strip()
    if not text:
        return default
    # Strip non-Latin characters that render as black boxes in built-in Helvetica,
    # keeping standard punctuation, currency, and dashes intact.
    cleaned = (
        text.replace("–", "-")
        .replace("—", "--")
        .replace("“", '"')
        .replace("”", '"')
        .replace("’", "'")
        .replace("‘", "'")
        .replace("•", "-")
        .replace("→", "->")
    )
    cleaned = cleaned.encode("latin-1", errors="ignore").decode("latin-1")
    return xml_escape(cleaned)


def _fmt_num(val: object) -> str:
    """Format numbers with commas safely without crashing on None or strings."""
    if isinstance(val, (int, float)):
        return f"{int(val):,}"
    if isinstance(val, str):
        digits = "".join(ch for ch in val if ch.isdigit())
        if digits:
            return f"{int(digits):,}"
    return "N/A"


def generate_career_dossier(session: dict, interview: Optional[dict] = None) -> bytes:
    """Generate a Career Dossier PDF from a complete session dict. Returns PDF bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
    )

    styles = getSampleStyleSheet()
    INK_COLOR = colors.HexColor("#0B0F14")
    BRASS_COLOR = colors.HexColor("#9A7B38")
    TEAL_COLOR = colors.HexColor("#2F6666")
    CRITICAL_COLOR = colors.HexColor("#B85450")
    MUTED_COLOR = colors.HexColor("#57534E")

    kicker_style = ParagraphStyle(
        "Kicker",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=BRASS_COLOR,
        spaceAfter=2,
        tracking=1,
    )
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=INK_COLOR,
        spaceAfter=4,
        alignment=0,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9.5,
        textColor=MUTED_COLOR,
        spaceAfter=3,
        leading=13,
    )
    h1_style = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=12.5,
        textColor=TEAL_COLOR,
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9.5,
        textColor=INK_COLOR,
        spaceAfter=4,
        leading=13.5,
    )
    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=body_style,
        leftIndent=10,
        spaceAfter=3,
    )

    def get_divider(color, thickness: float = 1.2):
        t = Table([[""]], colWidths=[doc.width], rowHeights=[1])
        t.setStyle(
            TableStyle(
                [
                    ("LINEABOVE", (0, 0), (-1, -1), thickness, color),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        return t

    story = []
    profile = session.get("profile_data") or {}
    market = session.get("market_data") or {}
    gap = session.get("gap_data") or {}
    roadmap = session.get("roadmap_data") or {}
    cv_rewrite = session.get("cv_rewrite_data") or {}

    candidate_name = _esc(profile.get("name") or session.get("candidate_name"), "Candidate")
    target_role = _esc(session.get("target_role"), "Technology Role")
    target_city = _esc(session.get("target_city"), "Pakistan")

    # Header
    story.append(Paragraph("USTAAD CAREER OS  |  OFFICIAL CAREER DOSSIER", kicker_style))
    story.append(Paragraph(candidate_name, title_style))
    story.append(
        Paragraph(
            f"<b>Target Role:</b> {target_role}  &nbsp;&nbsp;|&nbsp;&nbsp;  <b>Target Market:</b> {target_city}",
            meta_style,
        )
    )

    readiness = _esc(gap.get("overall_readiness_score"), "N/A")
    ats_score = _esc(cv_rewrite.get("ats_score_estimate"), "N/A")
    score_line = f"<b>Readiness Score:</b> {readiness}/100  &nbsp;&nbsp;|&nbsp;&nbsp;  <b>ATS Resume Score:</b> {ats_score}/100"
    if gap.get("jd_match_score") is not None:
        score_line += f"  &nbsp;&nbsp;|&nbsp;&nbsp;  <b>JD Match:</b> {_esc(gap.get('jd_match_score'))}%"
    if interview and interview.get("final_score") is not None:
        score_line += f"  &nbsp;&nbsp;|&nbsp;&nbsp;  <b>Mock Interview:</b> {_esc(interview.get('final_score'))}%"
    story.append(Paragraph(score_line, meta_style))
    story.append(Spacer(1, 0.15 * cm))
    story.append(get_divider(BRASS_COLOR, 1.5))
    story.append(Spacer(1, 0.25 * cm))

    # 01 / Market Snapshot
    story.append(Paragraph("01 / MARKET INTELLIGENCE", h1_style))
    story.append(
        Paragraph(
            f"<b>Demand Level:</b> {_esc(market.get('market_demand_level'), 'N/A')}  &nbsp;&nbsp;|&nbsp;&nbsp;  "
            f"<b>Remote Share:</b> {_esc(market.get('remote_percentage'), 'N/A')}",
            body_style,
        )
    )
    sal = market.get("salary_range_pkr") or {}
    if isinstance(sal, dict):
        min_sal = _fmt_num(sal.get("min"))
        max_sal = _fmt_num(sal.get("max"))
    else:
        min_sal, max_sal = "N/A", "N/A"
    story.append(
        Paragraph(f"<b>Estimated Salary Range:</b> PKR {min_sal} - {max_sal} / month", body_style)
    )
    req_skills = [_esc(s) for s in (market.get("top_required_skills") or [])[:10] if s]
    if req_skills:
        story.append(Paragraph(f"<b>Top Required Skills:</b> {', '.join(req_skills)}", body_style))
    companies = [_esc(c) for c in (market.get("top_hiring_companies") or [])[:8] if c]
    if companies:
        story.append(Paragraph(f"<b>Top Hiring Companies:</b> {', '.join(companies)}", body_style))
    if market.get("market_summary"):
        story.append(Paragraph(_esc(market.get("market_summary")), body_style))

    # 02 / Gap Analysis
    story.append(Paragraph("02 / SKILL GAP ANALYSIS", h1_style))
    if gap.get("summary"):
        story.append(Paragraph(_esc(gap.get("summary")), body_style))
    for g in (gap.get("critical_gaps") or []):
        if isinstance(g, dict):
            story.append(
                Paragraph(
                    f"<font color='#B85450'><b>[CRITICAL]</b></font> <b>{_esc(g.get('skill'))}:</b> {_esc(g.get('reason'))}",
                    bullet_style,
                )
            )
    for g in (gap.get("moderate_gaps") or [])[:4]:
        if isinstance(g, dict):
            story.append(
                Paragraph(
                    f"<font color='#9A7B38'><b>[MODERATE]</b></font> <b>{_esc(g.get('skill'))}:</b> {_esc(g.get('reason'))}",
                    bullet_style,
                )
            )

    # 03 / ATS CV Optimization
    story.append(Paragraph("03 / ATS-OPTIMIZED CV REWRITE", h1_style))
    if cv_rewrite.get("rewritten_summary"):
        story.append(Paragraph(f"<b>Executive Summary:</b> {_esc(cv_rewrite.get('rewritten_summary'))}", body_style))
    keywords_added = [_esc(k) for k in (cv_rewrite.get("keywords_added") or [])[:12] if k]
    if keywords_added:
        story.append(Paragraph(f"<b>Injected ATS Keywords:</b> {', '.join(keywords_added)}", body_style))
    for item in (cv_rewrite.get("rewritten_experience_bullets") or [])[:5]:
        if isinstance(item, dict) and item.get("rewritten"):
            story.append(Paragraph(f"- {_esc(item.get('rewritten'))}", bullet_style))
    for proj in (cv_rewrite.get("rewritten_projects") or [])[:4]:
        if isinstance(proj, dict) and proj.get("rewritten"):
            story.append(
                Paragraph(
                    f"- <b>{_esc(proj.get('name'), 'Project')}:</b> {_esc(proj.get('rewritten'))}",
                    bullet_style,
                )
            )

    # 04 / 30-Day Learning Roadmap
    story.append(Paragraph("04 / 30-DAY PRIORITY LEARNING ROADMAP", h1_style))
    for week in (roadmap.get("thirty_day_plan") or []):
        if isinstance(week, dict):
            story.append(
                Paragraph(
                    f"<b>Week {_esc(week.get('week'), '?')}: {_esc(week.get('focus'))}</b>",
                    body_style,
                )
            )
            for task in (week.get("tasks") or []):
                if isinstance(task, dict):
                    story.append(
                        Paragraph(
                            f"- {_esc(task.get('task'))} ({_esc(task.get('platform'), 'Free Resource')}, ~{_esc(task.get('estimated_hours'), '?')}h)",
                            bullet_style,
                        )
                    )

    # 05 / Quick Wins
    quick_wins = roadmap.get("quick_wins") or []
    if quick_wins:
        story.append(Paragraph("05 / QUICK WINS THIS WEEK", h1_style))
        for qw in quick_wins:
            if isinstance(qw, dict):
                story.append(
                    Paragraph(
                        f"- {_esc(qw.get('action'))} [{_esc(qw.get('impact'), 'High')} impact, {_esc(qw.get('time_required'), '')}]",
                        bullet_style,
                    )
                )

    # 06 / Mock Interview Summary (if completed or partially answered)
    if interview and (interview.get("scores") or interview.get("final_score") is not None):
        story.append(Paragraph("06 / AI MOCK INTERVIEW SCORECARD", h1_style))
        scores = interview.get("scores") or []
        final_pct = interview.get("final_score")
        story.append(
            Paragraph(
                f"<b>Questions Answered:</b> {len(scores)}  &nbsp;&nbsp;|&nbsp;&nbsp;  "
                f"<b>Overall Score:</b> {_esc(final_pct, 'In Progress')}{'%' if final_pct is not None else ''}",
                body_style,
            )
        )

    story.append(Spacer(1, 0.4 * cm))
    story.append(get_divider(MUTED_COLOR, 0.6))
    story.append(Spacer(1, 0.15 * cm))
    story.append(
        Paragraph("Generated by Ustaad AI Career OS  |  AgenticEra Systems", meta_style)
    )

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
