export function subscribeToPipeline(
  sessionId: string,
  onEvent: (data: PipelineEvent) => void,
  onDone: () => void
) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const es = new EventSource(`${API_URL}/api/pipeline/status/${sessionId}`);

  es.onmessage = (e) => {
    const data: PipelineEvent = JSON.parse(e.data);
    onEvent(data);
    if (data.event === "pipeline_complete" || data.event === "error") {
      es.close();
      onDone();
    }
  };

  es.onerror = () => {
    es.close();
    onDone();
  };

  return () => es.close(); // cleanup function
}

export interface PipelineEvent {
  event: "agent_start" | "agent_complete" | "pipeline_complete" | "error";
  agent?: string;
  message: string;
}
