import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { OccupancyData } from '@/models/Dashboard';

interface OccupancyChartProps {
  data: OccupancyData;
  loading?: boolean;
}

const COLORS = {
  occupied: '#10B981', // xanh
  vacant: '#F26419',   // cam
  maintenance: '#EF4444', // do
  reserved: '#8B5CF6'  // tim
};

export const OccupancyChart = ({ data, loading }: OccupancyChartProps) => {
  if (loading) {
    return <div className="h-[300px] w-full bg-bg animate-pulse rounded-full mx-auto max-w-[200px]"></div>;
  }

  const pieData = [
    { name: 'Đang thuê', value: data.occupied, fill: COLORS.occupied },
    { name: 'Phòng trống', value: data.vacant, fill: COLORS.vacant },
    { name: 'Bảo trì', value: data.maintenance, fill: COLORS.maintenance },
    { name: 'Đã đặt chỗ', value: data.reserved, fill: COLORS.reserved },
  ];

  return (
    <div className="h-[350px] w-full flex flex-col items-center">
      <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle"
              layout="horizontal"
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-display text-primary leading-none">{data.totalOccupancyRate}%</span>
          <span className="text-small text-muted font-bold mt-1">LẤP ĐẦY</span>
        </div>
      </div>
    </div>
  );
};
