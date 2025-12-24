import type {
  CreateServiceResponse,
  Service,
  ServicePayload,
  ServiceStatus,
  ServiceUptime,
  UptimeCheck,
} from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:4001";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

const buildUrl = (path: string) => {
  const base = API_BASE.replace(/\/$/, "");
  const prefix = API_PREFIX
    ? API_PREFIX.startsWith("/")
      ? API_PREFIX
      : `/${API_PREFIX}`
    : "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${prefix}${normalizedPath}`;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

type ApiEnvelope<T> = {
  resultData: T;
  message?: string;
};

async function fetchWrapped<T>(path: string): Promise<T> {
  const payload = await fetchJson<ApiEnvelope<T>>(path);
  return payload.resultData;
}

async function sendJson<TResponse>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export function getStatus(): Promise<ServiceStatus[]> {
  return fetchJson<ServiceStatus[]>("/status");
}

export function getServiceUptime(
  serviceId: number | string,
): Promise<ServiceUptime> {
  return fetchWrapped<ServiceUptime>(`/services/${serviceId}/uptime`);
}

export function getServices(): Promise<Service[]> {
  return fetchWrapped<Service[]>("/services");
}

export function getServiceById(serviceId: number | string): Promise<Service> {
  return fetchWrapped<Service>(`/services/${serviceId}`);
}

export function createService(
  payload: ServicePayload,
): Promise<CreateServiceResponse> {
  return sendJson<CreateServiceResponse>("/services", "POST", payload);
}

export function updateService(
  serviceId: number | string,
  payload: ServicePayload,
): Promise<{ message: string }> {
  return sendJson<{ message: string }>(
    `/services/${serviceId}`,
    "PUT",
    payload,
  );
}

export function deleteService(
  serviceId: number | string,
): Promise<{ message: string }> {
  return sendJson<{ message: string }>(`/services/${serviceId}`, "DELETE");
}

type UptimeCheckQuery = {
  from?: string;
  to?: string;
  limit?: number;
};

export function getUptimeChecks(
  serviceId: number | string,
  query?: UptimeCheckQuery,
): Promise<UptimeCheck[]> {
  const params = new URLSearchParams();
  if (query?.from) params.set("from", query.from);
  if (query?.to) params.set("to", query.to);
  if (query?.limit) params.set("limit", String(query.limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return fetchWrapped<UptimeCheck[]>(`/services/${serviceId}/checks${suffix}`);
}

export function getServiceStatus(
  serviceId: number | string,
): Promise<ServiceStatus> {
  return fetchJson<ServiceStatus>(`/services/${serviceId}/status`);
}
