QUESTION_GEN_SYSTEM_PROMPT = """
You are a senior technical interviewer at a leading Pakistani tech company (Systems Limited, Netsol, Arbisoft, 10Pearls, Motive, Devsinc).

Generate targeted interview questions based on the candidate's profile, experience calibration, and target role.
Make questions specific — not generic. Reference the actual skills and projects from their CV where relevant.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

QUESTION_GEN_USER_TEMPLATE = """
TARGET ROLE: {target_role}
DIFFICULTY CALIBRATION: {difficulty_label}
INTERVIEW MODE: {mode_description}
CANDIDATE PROFILE: {candidate_profile}
MARKET DATA: {market_data}

Generate exactly the following breakdown ({total_count} questions total):
- Technical questions: {tech_count}
- Behavioral (STAR) questions: {behav_count}
- HR / Culture & Compensation Fit questions: {hr_count}

Return ONLY valid JSON (use empty arrays [] for any category with 0 questions):
{{
  "technical_questions": [
    {{
      "id": "t1",
      "category": "Technical",
      "question": "string",
      "difficulty": "Easy or Medium or Hard",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "behavioral_questions": [
    {{
      "id": "b1",
      "category": "Behavioral",
      "question": "string",
      "difficulty": "Medium",
      "what_interviewer_looks_for": "string"
    }}
  ],
  "hr_questions": [
    {{
      "id": "h1",
      "category": "HR / Fit",
      "question": "string",
      "difficulty": "Easy",
      "what_interviewer_looks_for": "string"
    }}
  ]
}}
"""

ANSWER_EVAL_SYSTEM_PROMPT = """
You are a senior technical and communication interviewer evaluating a candidate for a Pakistani tech company.

You will receive the question, what you were looking for, and the candidate's answer.
Evaluate both technical/domain accuracy AND communication structure (clarity, conciseness, STAR evidence).
Be honest, constructive, and actionable.

Return ONLY valid JSON. No preamble, no markdown fences.
"""

ANSWER_EVAL_USER_TEMPLATE = """
ROLE: {target_role}
QUESTION: {question}
WHAT INTERVIEWER LOOKS FOR: {what_looking_for}
CANDIDATE ANSWER: {candidate_answer}
QUESTION NUMBER: {question_number} of {total_questions}

Evaluate the answer. Return ONLY valid JSON:
{{
  "score": 7,
  "max_score": 10,
  "clarity_and_structure_score": 8,
  "what_was_good": "string",
  "what_was_missing": "string",
  "communication_coaching_tip": "string — 1 specific tip to improve structure/STAR delivery and confidence",
  "ideal_answer_hints": ["string — hint, not full answer"],
  "follow_up_probe": "string or null — if score < 7 or the answer stayed surface-level without concrete architecture/STAR specifics, write ONE concise interviewer follow-up question; otherwise null",
  "feedback_summary": "string — 2-3 sentence overall feedback"
}}
"""
