export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}
