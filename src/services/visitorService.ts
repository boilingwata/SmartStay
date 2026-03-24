// No visitors table exists in the DB yet.
// Methods return empty data so the UI renders gracefully.
// The Visitor type is re-exported here so consumers need not import from mocks.

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
  getVisitors: async (filters?: { tenantId?: string; [key: string]: any }): Promise<Visitor[]> => {
    return [];
  },

  getVisitorDetail: async (id: string): Promise<Visitor | undefined> => {
    return undefined;
  },

  createVisitor: async (
    visitor: Omit<Visitor, 'id' | 'qrCode' | 'status'>,
  ): Promise<Visitor> => {
    // No-op until a visitors table is added to the schema.
    // Return a synthetic object so callers do not break on the resolved value.
    return {
      ...visitor,
      id: `V${Date.now()}`,
      qrCode: `QR-VIS-${Math.floor(Math.random() * 1000)}`,
      status: 'Expected',
    };
  },
};

export default visitorService;
