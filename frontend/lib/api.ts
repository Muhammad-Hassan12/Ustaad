import {
  FALLBACK_PROVIDERS,
  LLMProviderId,
  ProviderSpec,
  getActiveBYOKConfig,
} from "./llmConfig";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const bypassHeaders: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

export function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...bypassHeaders,
    ...extraHeaders,
  };

  if (typeof window !== "undefined") {
    const active = getActiveBYOKConfig();
    if (active && active.apiKey) {
      headers["X-LLM-Provider"] = active.provider;
      headers["X-LLM-Model"] = active.model;
      headers["X-LLM-API-Key"] = active.apiKey;
      if (active.region) {
        headers["X-LLM-Region"] = active.region;
      }
      if (active.provider === "gemini") {
        headers["X-Gemini-API-Key"] = active.apiKey;
      }
    }
  }

  return headers;
}

export interface KeyValidationResult {
  valid: boolean;
  source: "user_key" | "server_default" | "none";
  provider?: LLMProviderId | string;
  model?: string;
  detected_region?: "intl" | "cn";
  message?: string;
  error?: string;
}

export interface QuotaStatusResult {
  remaining: number;
  limit: number;
  status: "healthy" | "low";
}

export interface ProvidersCatalogResponse {
  default_provider: string;
  default_model: string;
  providers: ProviderSpec[];
}

export async function getProvidersCatalog(): Promise<ProvidersCatalogResponse> {
  try {
    const res = await fetch(`${API_URL}/api/keys/providers`, {
      headers: bypassHeaders,
    });
    if (!res.ok) throw new Error("Failed to load providers");
    return res.json();
  } catch {
    return {
      default_provider: "gemini",
      default_model: "gemini-3.1-flash-lite",
      providers: FALLBACK_PROVIDERS,
    };
  }
}

export async function getQuotaStatus(): Promise<QuotaStatusResult> {
  const res = await fetch(`${API_URL}/api/pipeline/quota-status`, {
    headers: bypassHeaders,
  });
  return res.json();
}

export interface ValidateKeyOptions {
  provider?: LLMProviderId;
  model?: string;
  apiKey?: string;
  region?: "intl" | "cn";
  forceServerDefault?: boolean;
}

export async function validateKey(
  keyOrOptions?: string | ValidateKeyOptions
): Promise<KeyValidationResult> {
  const headers: Record<string, string> = { ...bypassHeaders };

  if (typeof keyOrOptions === "string") {
    if (keyOrOptions.trim()) {
      headers["X-LLM-Provider"] = "gemini";
      headers["X-LLM-API-Key"] = keyOrOptions.trim();
      headers["X-Gemini-API-Key"] = keyOrOptions.trim();
    }
  } else if (keyOrOptions && !keyOrOptions.forceServerDefault) {
    if (keyOrOptions.apiKey && keyOrOptions.apiKey.trim()) {
      headers["X-LLM-Provider"] = keyOrOptions.provider || "gemini";
      headers["X-LLM-API-Key"] = keyOrOptions.apiKey.trim();
      if (keyOrOptions.model) {
        headers["X-LLM-Model"] = keyOrOptions.model.trim();
      }
      if (keyOrOptions.region) {
        headers["X-LLM-Region"] = keyOrOptions.region;
      }
    }
  } else if (keyOrOptions === undefined) {
    const active = getActiveBYOKConfig();
    if (active) {
      headers["X-LLM-Provider"] = active.provider;
      headers["X-LLM-Model"] = active.model;
      headers["X-LLM-API-Key"] = active.apiKey;
      if (active.region) {
        headers["X-LLM-Region"] = active.region;
      }
    }
  }

  const res = await fetch(`${API_URL}/api/keys/validate`, {
    method: "POST",
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

export async function getActiveInterview(sessionId: string) {
  const res = await fetch(`${API_URL}/api/interview/active/${sessionId}`, {
    headers: getHeaders(),
  });
  return res.json();
}

export async function startInterview(
  sessionId: string,
  options?: {
    mode?: string;
    difficulty?: string;
    force_new?: boolean;
  }
) {
  const res = await fetch(`${API_URL}/api/interview/start/${sessionId}`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(
      options || { mode: "sprint_5", difficulty: "junior", force_new: false }
    ),
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

export async function finishInterviewEarly(interviewId: string) {
  const res = await fetch(`${API_URL}/api/interview/finish/${interviewId}`, {
    method: "POST",
    headers: getHeaders(),
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
