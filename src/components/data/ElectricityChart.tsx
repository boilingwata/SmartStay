import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { ElectricityDataPoint } from '@/models/Dashboard';
import { useNavigate } from 'react-router-dom';

interface ElectricityChartProps {
  data: ElectricityDataPoint[];
  loading?: boolean;
}

const COLORS = ['#1B3A6B', '#0D8A8A', '#F26419', '#10B981', '#F59E0B'];

export const ElectricityChart = ({ data, loading }: ElectricityChartProps) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-[300px] w-full bg-bg animate-pulse rounded-xl"></div>;
  }

  // Get keys excluding 'month' for dynamic bars
  const buildings = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'month') : [];

  const handleBarClick = (buildingName: string, month: string) => {
    navigate(`/admin/reports/financial?building=${buildingName}&month=${month}`);
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#6B7280' }} 
            tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value))}
            label={{ value: 'VND', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fontSize: 11, fill: '#6B7280' } }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(27, 58, 107, 0.05)' }}
            formatter={(value: number) => [new Intl.NumberFormat('vi-VN').format(Number(value)) + ' d', 'Chi phi utility']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
          />
          {buildings.map((b, i) => (
            <Bar 
              key={b}
              name={b}
              dataKey={b} 
              fill={COLORS[i % COLORS.length]} 
              radius={[4, 4, 0, 0]} 
              barSize={12}
              className="cursor-pointer"
              onClick={(payload) => handleBarClick(b, payload.month)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
