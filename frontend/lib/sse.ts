export function subscribeToPipeline(
  sessionId: string,
  onEvent: (data: PipelineEvent) => void,
  onDone: () => void
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  let isCancelled = false;

  const readStream = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pipeline/status/${sessionId}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Accept": "text/event-stream"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (!isCancelled) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith("data:")) {
            try {
              const jsonStr = cleanLine.substring(5).trim();
              const data: PipelineEvent = JSON.parse(jsonStr);
              onEvent(data);
              if (data.event === "pipeline_complete" || data.event === "error") {
                isCancelled = true;
                onDone();
                return;
              }
            } catch (err) {
              console.error("Failed to parse SSE data line:", cleanLine, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("SSE stream fetch error:", err);
      onEvent({ 
        event: "error", 
        message: `Connection failed: ${err instanceof Error ? err.message : String(err)}` 
      });
      onDone();
    }
  };

  readStream();

  return () => {
    isCancelled = true;
  };
}

export interface PipelineEvent {
  event: "agent_start" | "agent_complete" | "pipeline_complete" | "error";
  agent?: string;
  message: string;
}
