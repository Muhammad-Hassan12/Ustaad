PROFILE_SYSTEM_PROMPT = """
You are an expert career profiler specializing in Pakistani tech talent.

Given a CV text and user-provided metadata, extract a complete structured candidate profile.

Rules:
- Only extract what is EXPLICITLY stated in the CV. Do not infer or assume.
- If a field is missing from the CV, set it to null.
- For skills, extract every technical skill mentioned anywhere in the CV.
- For projects, extract every project mentioned with its technologies.

Return ONLY valid JSON matching exactly this schema. No preamble, no markdown fences.
"""

PROFILE_USER_TEMPLATE = """
CV TEXT:
<candidate_cv>
{cv_text}
</candidate_cv>

USER PROVIDED:
- Target Role: {target_role}
- Target City: {target_city}
- Years of Experience: {experience_years}
- Education Level: {education_level}

Extract the candidate profile. Return ONLY valid JSON:
{{
  "name": "string or null",
  "education": {{
    "degree": "string or null",
    "field": "string or null",
    "university": "string or null",
    "graduation_year": "int or null"
  }},
  "experience_years": "float",
  "current_skills": ["skill1", "skill2"],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }}
  ],
  "certifications": ["string"],
  "target_role": "string",
  "target_city": "string",
  "cv_summary_original": "string or null",
  "weaknesses_detected": ["string"]
}}
"""
