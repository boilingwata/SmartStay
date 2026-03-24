import React from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { RevenueDataPoint } from '@/models/Dashboard';
import { formatVND } from '@/utils';
import { useNavigate } from 'react-router-dom';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

const COLORS = {
  primary: '#1B3A6B',
  accent: '#F26419'
};

export const RevenueChart = ({ data, loading }: RevenueChartProps) => {
  const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (loading) {
    return <div className="h-[300px] w-full bg-bg animate-pulse rounded-xl"></div>;
  }

  // Spec 1.4: Mobile: hien 6 thang thay vi 12
  const chartData = isMobile ? data.slice(-6) : data;

  const handleBarClick = (item: any) => {
    if (item && item.month) {
      navigate(`/reports/financial?month=${item.month}`);
    }
  };

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          onClick={(data) => data && data.activePayload && handleBarClick(data.activePayload[0].payload)}
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
            yAxisId="left"
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#6B7280' }} 
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
          />
          {!isMobile && (
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6B7280' }} 
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
            />
          )}
          <Tooltip 
            cursor={{ fill: 'rgba(27, 58, 107, 0.05)' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [formatVND(value), '']}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}
          />
          <Bar 
            yAxisId="left"
            name="Doanh thu" 
            dataKey="revenue" 
            fill={COLORS.primary} 
            radius={[4, 4, 0, 0]} 
            barSize={isMobile ? 16 : 24}
            className="cursor-pointer"
          />
          {!isMobile && (
            <Line 
              yAxisId="right"
              name="Lợi nhuận" 
              type="monotone" 
              dataKey="profit" 
              stroke={COLORS.accent} 
              strokeWidth={3} 
              dot={{ r: 4, fill: COLORS.accent, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
