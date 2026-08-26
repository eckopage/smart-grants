const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json() as Promise<HealthStatus>;
}
