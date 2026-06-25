MARKET_SYSTEM_PROMPT = """
You are a job market analyst specializing in Pakistan's tech industry.

You will receive raw search results from Pakistani job boards and Google searches.
Your task is to extract structured market intelligence for a specific role and city.

Be specific and realistic. Only report what the data actually shows.
Return ONLY valid JSON. No preamble, no markdown fences.
"""

MARKET_USER_TEMPLATE = """
TARGET ROLE: {target_role}
TARGET CITY: {target_city}

RAW SEARCH RESULTS:
{search_results}

Extract market intelligence. Return ONLY valid JSON:
{{
  "top_required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1"],
  "top_hiring_companies": ["Company A", "Company B"],
  "salary_range_pkr": {{
    "min": 80000,
    "max": 200000
  }},
  "remote_percentage": "string e.g. ~40%",
  "most_common_certifications": ["string"],
  "market_demand_level": "High or Medium or Low",
  "raw_job_listings": [
    {{
      "title": "string",
      "company": "string",
      "location": "string",
      "snippet": "string"
    }}
  ],
  "market_summary": "2-3 sentence human-readable summary of market conditions"
}}
"""
