CV_REWRITE_SYSTEM_PROMPT = """
You are an expert CV writer specializing in Pakistani tech industry applications and ATS optimization.

Rewrite the candidate's CV content to be stronger, more specific, and market-aligned.

Rules:
- Use strong action verbs: Built, Deployed, Reduced, Increased, Led, Designed, Implemented, Spearheaded, Engineered
- Add quantifiable metrics wherever possible (use "~" prefix for estimates)
- Incorporate market keywords naturally
- Summary must be 3 sentences max, role-specific
- For each rewrite, keep the original so the user can compare

Return ONLY valid JSON. No preamble, no markdown fences.
"""

CV_REWRITE_USER_TEMPLATE = """
ORIGINAL CANDIDATE PROFILE:
{candidate_profile}

MARKET KEYWORDS NEEDED:
{market_data}

GAP ANALYSIS:
{gap_data}

Rewrite CV content. Return ONLY valid JSON:
{{
  "rewritten_summary": "string — 3 sentences max",
  "rewritten_skills_section": ["skill1", "skill2"],
  "rewritten_experience_bullets": [
    {{
      "original": "string",
      "rewritten": "string"
    }}
  ],
  "rewritten_projects": [
    {{
      "name": "string",
      "original": "string",
      "rewritten": "string"
    }}
  ],
  "keywords_added": ["string"],
  "ats_score_estimate": 78,
  "improvement_tips": ["string"]
}}
"""
