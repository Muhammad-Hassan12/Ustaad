const API_URL = process.env.NEXT_PUBLIC_API_URL;

const bypassHeaders = {
  "ngrok-skip-browser-warning": "true"
};

export async function startPipeline(formData: FormData) {
  const res = await fetch(`${API_URL}/api/pipeline/start`, {
    method: "POST",
    headers: bypassHeaders,
    body: formData,
  });
  return res.json();
}

export async function getPipelineResults(sessionId: string) {
  const res = await fetch(`${API_URL}/api/pipeline/results/${sessionId}`, {
    headers: bypassHeaders
  });
  return res.json();
}

export async function startInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/start/${sessionId}`, {
    method: "POST",
    headers: bypassHeaders
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
    headers: { 
      "Content-Type": "application/json",
      ...bypassHeaders
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getInterviewSummary(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/summary/${sessionId}`, {
    headers: bypassHeaders
  });
  return res.json();
}

export function getDossierUrl(sessionId: string) {
  return `${API_URL}/api/export/dossier/${sessionId}`;
}
