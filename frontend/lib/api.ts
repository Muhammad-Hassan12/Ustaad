const API_URL = process.env.NEXT_PUBLIC_API_URL;

const bypassHeaders = {
  "ngrok-skip-browser-warning": "true"
};

export function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...bypassHeaders,
    ...extraHeaders,
  };

  if (typeof window !== "undefined") {
    const key = localStorage.getItem("gemini_api_key");
    if (key && key.trim()) {
      headers["X-Gemini-API-Key"] = key.trim();
    }
  }

  return headers;
}

export interface KeyValidationResult {
  valid: boolean;
  source: "user_key" | "server_default" | "none";
  model?: string;
  message?: string;
  error?: string;
}

export interface QuotaStatusResult {
  remaining: number;
  limit: number;
  status: "healthy" | "low";
}

export async function getQuotaStatus(): Promise<QuotaStatusResult> {
  const res = await fetch(`${API_URL}/api/pipeline/quota-status`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function validateKey(key?: string): Promise<KeyValidationResult> {
  let targetKey = key;
  if (targetKey === undefined && typeof window !== "undefined") {
    targetKey = localStorage.getItem("gemini_api_key") || undefined;
  }

  const headers: Record<string, string> = {
    ...bypassHeaders,
  };
  if (targetKey && targetKey.trim()) {
    headers["X-Gemini-API-Key"] = targetKey.trim();
  }

  const res = await fetch(`${API_URL}/api/keys/validate`, {
    headers,
  });
  return res.json();
}

export async function startPipeline(formData: FormData) {
  const res = await fetch(`${API_URL}/api/pipeline/start`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  return res.json();
}

export async function getPipelineResults(sessionId: string) {
  const res = await fetch(`${API_URL}/api/pipeline/results/${sessionId}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function startInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/start/${sessionId}`, {
    method: "POST",
    headers: getHeaders(),
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
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function getInterviewSummary(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/summary/${sessionId}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export function getDossierUrl(sessionId: string) {
  return `${API_URL}/api/export/dossier/${sessionId}`;
}

