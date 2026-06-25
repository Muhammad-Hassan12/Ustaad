const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function startPipeline(formData: FormData) {
  const res = await fetch(`${API_URL}/api/pipeline/start`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function getPipelineResults(sessionId: string) {
  const res = await fetch(`${API_URL}/api/pipeline/results/${sessionId}`);
  return res.json();
}

export async function startInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/start/${sessionId}`, {
    method: "POST",
  });
  return res.json();
}

export async function submitAnswer(payload: {
  session_id: string;
  interview_id: string;
  question_id: string;
  answer: string;
}) {
  const res = await fetch(`${API_URL}/api/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getInterviewSummary(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/summary/${sessionId}`);
  return res.json();
}

export function getDossierUrl(sessionId: string) {
  return `${API_URL}/api/export/dossier/${sessionId}`;
}
