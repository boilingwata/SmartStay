/**
 * Visitor Service — FEATURE STUB
 *
 * The `visitors` table does NOT exist in the `smartstay` schema.
 * Read methods return empty data. createVisitor throws a user-friendly error
 * instead of silently creating a non-persistent in-memory object that disappears on refresh.
 *
 * TO ENABLE THIS FEATURE:
 *   1. Run migration: CREATE TABLE smartstay.visitors (...)
 *   2. Re-generate src/types/supabase.ts
 *   3. Replace stubs with real supabase queries
 */
export type VisitorStatus = 'Expected' | 'Arrived' | 'Departed';

export interface Visitor {
  id: string;
  name: string;
  idCard?: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  status: VisitorStatus;
  qrCode: string;
  roomCode?: string;
  tenantId: string;
}

export const visitorService = {
  getVisitors: async (_filters?: { tenantId?: string; [key: string]: unknown }): Promise<Visitor[]> => {
    // VIS-01: No visitors table in DB — return empty list gracefully
    return [];
  },

  getVisitorDetail: async (_id: string): Promise<Visitor | undefined> => {
    return undefined;
  },

  createVisitor: async (
    _visitor: Omit<Visitor, 'id' | 'qrCode' | 'status'>,
  ): Promise<Visitor> => {
    // VIS-01 FIX: Replaced silent fake-object creation with an explicit user-facing error.
    // Previously this returned a fake object that vanished on page refresh.
    throw new Error(
      'Tính năng quản lý khách thăm chưa được kích hoạt. ' +
      'Vui lòng liên hệ quản trị viên để tạo bảng visitors.'
    );
  },
};

export default visitorService;
