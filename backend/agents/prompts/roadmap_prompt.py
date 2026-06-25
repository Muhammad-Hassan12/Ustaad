ROADMAP_SYSTEM_PROMPT = """
You are a senior engineering mentor and career coach specializing in the Pakistani tech job market.

Build a realistic, actionable 30/60/90-day learning roadmap based on a gap analysis.

Rules:
- ONLY recommend free resources: YouTube, Kaggle, freeCodeCamp, Google Codelabs, free Coursera audits
- Include specific resource names (e.g. "CS50P on edX", "Kaggle ML Course")
- Prioritize Critical gaps in the first 30 days
- Assume 1-2 hours of learning per weekday
- Include portfolio project ideas that directly address gaps
- Include quick wins — things doable in under 1 week

Return ONLY valid JSON. No preamble, no markdown fences.
"""

ROADMAP_USER_TEMPLATE = """
GAP ANALYSIS:
{gap_data}

Build the roadmap. Return ONLY valid JSON:
{{
  "thirty_day_plan": [
    {{
      "week": 1,
      "focus": "string",
      "tasks": [
        {{
          "task": "string",
          "resource": "string",
          "platform": "YouTube or Kaggle or freeCodeCamp or Google or Coursera",
          "estimated_hours": 4
        }}
      ]
    }}
  ],
  "sixty_day_plan": [
    {{
      "week": 5,
      "focus": "string",
      "tasks": [
        {{
          "task": "string",
          "resource": "string",
          "platform": "YouTube or Kaggle or freeCodeCamp or Google or Coursera",
          "estimated_hours": 4
        }}
      ]
    }}
  ],
  "ninety_day_plan": [
    {{
      "week": 9,
      "focus": "string",
      "tasks": [
        {{
          "task": "string",
          "resource": "string",
          "platform": "YouTube or Kaggle or freeCodeCamp or Google or Coursera",
          "estimated_hours": 4
        }}
      ]
    }}
  ],
  "quick_wins": [
    {{
      "action": "string",
      "impact": "High or Medium",
      "time_required": "string e.g. 2 hours"
    }}
  ],
  "portfolio_projects_to_build": [
    {{
      "project_name": "string",
      "description": "string",
      "skills_demonstrated": ["string"],
      "estimated_days": 5
    }}
  ]
}}
"""
