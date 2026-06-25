QUESTION_GEN_SYSTEM_PROMPT = """
You are a senior technical interviewer at a Pakistani tech company (Systems Limited, Netsol, Arbisoft, 10Pearls).

Generate targeted interview questions based on the candidate's profile and target role.
Make questions specific — not generic. Reference the actual skills and projects from their CV.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

QUESTION_GEN_USER_TEMPLATE = """
TARGET ROLE: {target_role}
CANDIDATE PROFILE: {candidate_profile}
MARKET DATA: {market_data}

Generate 15 interview questions (5 technical, 5 behavioral, 5 HR/culture-fit).
Return ONLY valid JSON:
{{
  "technical_questions": [
    {{
      "id": "t1",
      "question": "string",
      "difficulty": "Easy or Medium or Hard",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "behavioral_questions": [
    {{
      "id": "b1",
      "question": "string",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "hr_questions": [
    {{
      "id": "h1",
      "question": "string",
      "what_interviewer_looks_for": "string"
    }}
  ]
}}
"""

ANSWER_EVAL_SYSTEM_PROMPT = """
You are a senior technical interviewer evaluating a candidate for a Pakistani tech company.

You will receive the question, what you were looking for, and the candidate's answer.
Evaluate honestly but constructively. This is for the candidate's improvement.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

ANSWER_EVAL_USER_TEMPLATE = """
ROLE: {target_role}
QUESTION: {question}
WHAT INTERVIEWER LOOKS FOR: {what_looking_for}
CANDIDATE ANSWER: {candidate_answer}
QUESTION NUMBER: {question_number} of 15

Evaluate the answer. Return ONLY valid JSON:
{{
  "score": 7,
  "max_score": 10,
  "what_was_good": "string",
  "what_was_missing": "string",
  "ideal_answer_hints": ["string — hint, not full answer"],
  "feedback_summary": "string — 2-3 sentence overall feedback"
}}
"""
