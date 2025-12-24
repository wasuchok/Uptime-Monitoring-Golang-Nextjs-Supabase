export type ServiceStatus = {
  service_id: number;
  name: string;
  url: string;
  is_up: boolean;
  status_code: number;
  response_time: number;
  last_checked_at: string;
};

export type ServiceUptime = {
  service_id: number;
  from?: string;
  to?: string;
  uptime_percent: number;
  avg_response_time: number;
  total_checks: number;
  up_checks: number;
  down_checks: number;
};

export type Service = {
  id: number;
  name: string;
  url: string;
  method: string;
  expected_status: number;
  timeout_ms: number;
  interval_sec: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServicePayload = {
  name: string;
  url: string;
  method: string;
  expected_status: number;
  timeout_ms: number;
  interval_sec: number;
};

export type CreateServiceResponse = {
  id: string;
};

export type UptimeCheck = {
  id: string;
  service_id: string;
  status_code: number;
  response_time: number;
  is_up: boolean;
  error_message: string;
  checked_at: string;
};
