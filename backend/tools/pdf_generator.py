from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO

def generate_career_dossier(session: dict) -> bytes:
    """Generate a Career Dossier PDF from a complete session dict. Returns PDF bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    BRAND_COLOR = colors.HexColor("#0F172A")
    ACCENT_COLOR = colors.HexColor("#6366F1")

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  fontSize=24, textColor=BRAND_COLOR, spaceAfter=6, alignment=0)
    h1_style = ParagraphStyle('H1', parent=styles['Heading1'],
                               fontSize=14, textColor=ACCENT_COLOR, spaceBefore=16, spaceAfter=6)
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
                                 fontSize=10, spaceAfter=4, leading=14)

    story = []
    profile = session.get("profile_data", {})
    market = session.get("market_data", {})
    gap = session.get("gap_data", {})
    roadmap = session.get("roadmap_data", {})
    cv_rewrite = session.get("cv_rewrite_data", {})

    # Helper to draw a horizontal rule
    def get_divider(color):
        t = Table([['']], colWidths=[doc.width], rowHeights=[1])
        t.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1.5, color),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        return t

    # Header
    story.append(Paragraph("Ustaad (اُستاد) — Career Dossier", title_style))
    story.append(Paragraph(f"Prepared for: {profile.get('name', 'Candidate')}", body_style))
    story.append(Paragraph(f"Target Role: {session.get('target_role', '')} | City: {session.get('target_city', '')}", body_style))
    story.append(Spacer(1, 0.1*cm))
    story.append(get_divider(ACCENT_COLOR))
    story.append(Spacer(1, 0.3*cm))

    # Market Snapshot
    story.append(Paragraph("📊 Market Intelligence", h1_style))
    story.append(Paragraph(f"<b>Demand Level:</b> {market.get('market_demand_level', 'N/A')}", body_style))
    story.append(Paragraph(f"<b>Top Skills Required:</b> {', '.join(market.get('top_required_skills', [])[:8])}", body_style))
    sal = market.get("salary_range_pkr", {})
    story.append(Paragraph(f"<b>Salary Range:</b> PKR {sal.get('min', 'N/A'):,} – {sal.get('max', 'N/A'):,}/month", body_style))
    story.append(Paragraph(market.get("market_summary", ""), body_style))
    story.append(Spacer(1, 0.3*cm))

    # Gap Analysis
    story.append(Paragraph("🔍 Gap Analysis", h1_style))
    story.append(Paragraph(f"<b>Readiness Score:</b> {gap.get('overall_readiness_score', 'N/A')}/100", body_style))
    story.append(Paragraph(gap.get("summary", ""), body_style))
    for g in gap.get("critical_gaps", []):
        story.append(Paragraph(f"❌ <b>CRITICAL:</b> {g['skill']} — {g['reason']}", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Rewritten CV Summary
    story.append(Paragraph("📝 Optimized CV Summary", h1_style))
    story.append(Paragraph(cv_rewrite.get("rewritten_summary", ""), body_style))
    story.append(Paragraph(f"<b>ATS Score Estimate:</b> {cv_rewrite.get('ats_score_estimate', 'N/A')}/100", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Roadmap (30-day only in PDF for brevity)
    story.append(Paragraph("🗺️ 30-Day Learning Roadmap", h1_style))
    for week in roadmap.get("thirty_day_plan", []):
        story.append(Paragraph(f"<b>Week {week['week']}:</b> {week['focus']}", body_style))
        for task in week.get("tasks", []):
            story.append(Paragraph(f"  • {task['task']} ({task['platform']}, ~{task.get('estimated_hours', '?')}h)", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Quick wins
    story.append(Paragraph("⚡ Quick Wins This Week", h1_style))
    for qw in roadmap.get("quick_wins", []):
        story.append(Paragraph(f"• {qw['action']} [{qw['impact']} impact, {qw['time_required']}]", body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
