import {
  FALLBACK_PROVIDERS,
  LLMProviderId,
  ProviderSpec,
  getActiveBYOKConfig,
} from "./llmConfig";
import { apiUrl } from "./config";

/**
 * Loosely-typed JSON payload returned by the backend. The pages validate the
 * fields they use, so this mirrors the previous `res.json()` (`any`) behaviour.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiJson = any;

/** Error thrown for every non-2xx backend response (or unreadable body). */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function genericMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The request was invalid.";
    case 404:
      return "Not found.";
    case 409:
      return "That action conflicts with the current state. Please refresh and try again.";
    case 422:
      return "The submitted data was invalid.";
    case 429:
      return "Too many requests. Please try again shortly.";
    case 502:
    case 503:
    case 504:
      return "The server or upstream AI provider is temporarily unavailable. Please try again.";
    default:
      return status >= 500
        ? `Server error (HTTP ${status}). Please try again.`
        : `Request failed (HTTP ${status}).`;
  }
}

function extractDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as { msg?: unknown }).msg === "string") {
          return (item as { msg: string }).msg;
        }
        return "";
      })
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  return null;
}

/**
 * Parse a fetch Response. Throws `ApiError` (with a user-presentable message)
 * for any non-OK status; otherwise returns the parsed JSON body.
 */
export async function parseResponse<T = ApiJson>(res: Response): Promise<T> {
  let body: unknown = null;
  let parsed = false;
  try {
    const text = await res.text();
    if (text) {
      body = JSON.parse(text);
      parsed = true;
    }
  } catch {
    // Non-JSON body (e.g. proxy error page) — fall back to a generic message.
  }

  if (!res.ok) {
    let message = extractDetail(body) || genericMessageForStatus(res.status);
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const seconds = retryAfter ? Number(retryAfter) : NaN;
      if (Number.isFinite(seconds) && seconds > 0) {
        message = `${message} Please retry in ${Math.ceil(seconds)} seconds.`;
      }
    }
    throw new ApiError(message, res.status);
  }

  if (!parsed) {
    throw new ApiError("The server returned an unreadable response.", res.status);
  }
  return body as T;
}

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
    const res = await fetch(apiUrl("/api/keys/providers"), {
      headers: bypassHeaders,
    });
    return await parseResponse<ProvidersCatalogResponse>(res);
  } catch {
    return {
      default_provider: "gemini",
      default_model: "gemini-3.1-flash-lite",
      providers: FALLBACK_PROVIDERS,
    };
  }
}

export async function getQuotaStatus(): Promise<QuotaStatusResult> {
  const res = await fetch(apiUrl("/api/pipeline/quota-status"), {
    headers: bypassHeaders,
  });
  return parseResponse<QuotaStatusResult>(res);
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

  const res = await fetch(apiUrl("/api/keys/validate"), {
    method: "POST",
    headers,
  });
  return parseResponse<KeyValidationResult>(res);
}

export async function startPipeline(formData: FormData) {
  const res = await fetch(apiUrl("/api/pipeline/start"), {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  return parseResponse(res);
}

export async function reauditPipeline(baselineSessionId: string, formData: FormData) {
  const res = await fetch(apiUrl(`/api/pipeline/reaudit/${encodeURIComponent(baselineSessionId)}`), {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  return parseResponse(res);
}

export async function getPipelineResults(sessionId: string) {
  const res = await fetch(apiUrl(`/api/pipeline/results/${encodeURIComponent(sessionId)}`), {
    headers: getHeaders(),
  });
  return parseResponse(res);
}

export async function getActiveInterview(sessionId: string) {
  const res = await fetch(apiUrl(`/api/interview/active/${encodeURIComponent(sessionId)}`), {
    headers: getHeaders(),
  });
  return parseResponse(res);
}

export async function startInterview(
  sessionId: string,
  options?: {
    mode?: string;
    difficulty?: string;
    force_new?: boolean;
  }
) {
  const res = await fetch(apiUrl(`/api/interview/start/${encodeURIComponent(sessionId)}`), {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(
      options || { mode: "sprint_5", difficulty: "junior", force_new: false }
    ),
  });
  return parseResponse(res);
}

export async function submitAnswer(payload: {
  session_id: string;
  interview_id: string;
  question_id: string;
  answer: string;
}) {
  const res = await fetch(apiUrl("/api/interview/answer"), {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function submitProbeAnswer(payload: {
  session_id: string;
  interview_id: string;
  parent_question_id: string;
  probe_question: string;
  answer: string;
}) {
  const res = await fetch(apiUrl("/api/interview/probe"), {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function finishInterviewEarly(interviewId: string) {
  const res = await fetch(apiUrl(`/api/interview/finish/${encodeURIComponent(interviewId)}`), {
    method: "POST",
    headers: getHeaders(),
  });
  return parseResponse(res);
}

export interface ResumeContact {
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  github: string | null;
}

/** Contact details extracted server-side from the CV (used by the printable resume). */
export async function getResumeContact(sessionId: string): Promise<ResumeContact> {
  const res = await fetch(apiUrl(`/api/pipeline/contact/${encodeURIComponent(sessionId)}`), {
    headers: getHeaders(),
  });
  return parseResponse<ResumeContact>(res);
}

/** Throws ApiError(404) when no interview exists for the session. */
export async function getInterviewSummary(sessionId: string) {
  const res = await fetch(apiUrl(`/api/interview/summary/${encodeURIComponent(sessionId)}`), {
    headers: getHeaders(),
  });
  return parseResponse(res);
}

export function getDossierUrl(sessionId: string) {
  return apiUrl(`/api/export/dossier/${encodeURIComponent(sessionId)}`);
}
