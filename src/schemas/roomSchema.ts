import * as z from 'zod';

export const roomSchema = z.object({
  roomCode: z.string().min(2, 'Mã phòng ít nhất 2 ký tự').toUpperCase(),
  buildingId: z.string().min(1, 'Vui lòng chọn tòa nhà'),
  floorNumber: z.number().min(0),
  roomType: z.enum(['Studio', '1BR', '2BR', '3BR', 'Penthouse', 'Commercial']),
  areaSqm: z.number().min(1, 'Diện tích phải lớn hơn 0'),
  baseRentPrice: z.number().min(0),
  maxOccupancy: z.number().min(1),
  furnishing: z.enum(['Unfurnished', 'SemiFurnished', 'FullyFurnished']),
  directionFacing: z.enum(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']),
  hasBalcony: z.boolean().default(false),
  conditionScore: z.number().min(1).max(10),
  amenities: z.array(z.string()),
  description: z.string().optional()
});

export type RoomFormData = z.infer<typeof roomSchema>;
