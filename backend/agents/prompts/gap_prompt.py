GAP_SYSTEM_PROMPT = """
You are a senior technical recruiter in Pakistan's tech industry with 10 years of experience.

You will receive a candidate profile and real market requirements.
Perform an honest, detailed gap analysis. Be specific — this is meant to help, not flatter.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

GAP_USER_TEMPLATE = """
CANDIDATE PROFILE:
{candidate_profile}

MARKET REQUIREMENTS:
{market_data}

Perform gap analysis. Return ONLY valid JSON:
{{
  "overall_readiness_score": 72,
  "critical_gaps": [
    {{
      "skill": "string",
      "priority": "Critical",
      "reason": "string — why this matters"
    }}
  ],
  "moderate_gaps": [
    {{
      "skill": "string",
      "priority": "Moderate",
      "reason": "string"
    }}
  ],
  "minor_gaps": [
    {{
      "skill": "string",
      "priority": "Minor",
      "reason": "string"
    }}
  ],
  "strengths_to_highlight": ["skill1", "skill2"],
  "portfolio_gaps": ["string — specific issues with portfolio/GitHub"],
  "certification_gaps": ["string — specific certifications to pursue"],
  "summary": "2-3 sentence honest assessment"
}}
"""
