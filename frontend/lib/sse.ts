import { ApiError, parseResponse } from "./api";
import { apiUrl } from "./config";

/** Backoff delays (ms) for reconnect attempts after a dropped stream. */
const RECONNECT_DELAYS_MS = [1000, 2000, 4000];

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Subscribe to the pipeline SSE stream.
 *
 * Server semantics: every connection replays the full event history from the
 * start, so events may repeat after a reconnect (consumers must be idempotent),
 * `: keepalive` comment lines are ignored, and the stream always ends with a
 * `pipeline_complete` or `error` event.
 *
 * - `onDone` is called exactly once: after a terminal event, after the stream
 *   ends cleanly without one (the caller should then fall back to fetching
 *   results), or after reconnect attempts are exhausted (preceded by an
 *   `error` event).
 * - The returned function cancels the subscription (aborts the request);
 *   no callbacks fire afterwards.
 */
export function subscribeToPipeline(
  sessionId: string,
  onEvent: (data: PipelineEvent) => void,
  onDone: () => void
) {
  const controller = new AbortController();
  const signal = controller.signal;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    controller.abort();
    onDone();
  };

  const emit = (data: PipelineEvent) => {
    if (finished || signal.aborted) return;
    onEvent(data);
  };

  /**
   * Read one connection. Resolves "terminal" when a terminal event was
   * delivered, "ended" when the stream closed cleanly without one.
   */
  const readOnce = async (): Promise<"terminal" | "ended"> => {
    const response = await fetch(
      apiUrl(`/api/pipeline/status/${encodeURIComponent(sessionId)}`),
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          Accept: "text/event-stream",
        },
        signal,
      }
    );

    if (!response.ok) {
      await parseResponse(response); // throws ApiError with the server's detail
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    /** Returns true when a terminal event was handled. */
    const handleLine = (line: string): boolean => {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith("data:")) return false; // comments / keepalives / other fields
      let data: PipelineEvent;
      try {
        data = JSON.parse(cleanLine.substring(5).trim());
      } catch (err) {
        console.error("Failed to parse SSE data line:", cleanLine, err);
        return false;
      }
      if (!data || typeof data !== "object") return false;
      emit(data);
      return data.event === "pipeline_complete" || data.event === "error";
    };

    while (!signal.aborted && !finished) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (handleLine(line)) return "terminal";
        if (finished || signal.aborted) return "terminal";
      }
    }

    if (!signal.aborted && !finished) {
      buffer += decoder.decode();
      if (buffer && handleLine(buffer)) return "terminal";
    }
    return "ended";
  };

  const run = async () => {
    let attempt = 0;
    while (!signal.aborted && !finished) {
      try {
        const outcome = await readOnce();
        if (outcome === "terminal") {
          finish();
        } else if (!signal.aborted) {
          // Stream closed without a terminal event: let the caller fall back to
          // fetching results.
          finish();
        }
        return;
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;

        const status = err instanceof ApiError ? err.status : 0;
        const retryable = status === 0 || status >= 500 || status === 429;
        if (retryable && attempt < RECONNECT_DELAYS_MS.length) {
          const delay = RECONNECT_DELAYS_MS[attempt];
          attempt += 1;
          await sleep(delay, signal);
          continue;
        }

        console.error("SSE stream fetch error:", err);
        emit({
          event: "error",
          message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
        });
        finish();
        return;
      }
    }
  };

  void run();

  return () => {
    // Cancelled by the caller: abort the request and suppress further callbacks.
    finished = true;
    controller.abort();
  };
}

export interface PipelineEvent {
  event: "agent_start" | "agent_complete" | "pipeline_complete" | "error";
  agent?: string;
  message: string;
}
