import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Zap, Droplets, ArrowLeft, History, 
  TrendingUp, Calendar, User, Eye, 
  Clock, Edit3, Trash2, ArrowRight,
  ChevronRight, MoreVertical, LayoutList,
  BarChart2, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { meterService } from '@/services/meterService';
import { MeterReading, Meter } from '@/models/Meter';
import { cn } from '@/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner, Skeleton } from '@/components/ui/Feedback';
import { differenceInMinutes } from 'date-fns';
import { usePermission } from '@/hooks/usePermission';

const MeterReadingHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  // Mock data for chart (12 months)
  const chartData = [
    { month: '04/23', consumption: 120 },
    { month: '05/23', consumption: 145 },
    { month: '06/23', consumption: 190 },
    { month: '07/23', consumption: 210 },
    { month: '08/23', consumption: 185 },
    { month: '09/23', consumption: 160 },
    { month: '10/23', consumption: 130 },
    { month: '11/23', consumption: 115 },
    { month: '12/23', consumption: 140 },
    { month: '01/24', consumption: 155 },
    { month: '02/24', consumption: 125 },
    { month: '03/24', consumption: 142 },
  ];

  // Queries
  const { data: meter, isLoading: isLoadingMeter } = useQuery({
    queryKey: ['meter-detail', id],
    queryFn: () => meterService.getMeters({ buildingId: 'B1' }).then(res => res.data.find((m: Meter) => m.id === id))
  });

  const { data: readings, isLoading: isLoadingReadings } = useQuery({
    queryKey: ['meter-readings', id],
    queryFn: () => meterService.getReadings({ meterId: id! })
  });

  const { data: latestReading, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['meter-latest', id],
    queryFn: () => meterService.getLatestReading(id!)
  });

  if (isLoadingMeter) return <div className="h-screen flex items-center justify-center"><Spinner className="w-10 h-10" /></div>;
  if (!meter) return <div className="p-20 text-center text-muted font-black uppercase tracking-widest">Không tìm thấy đồng hồ</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* 5.4.1 Meter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
         <div className="flex items-center gap-6">
            <button onClick={() => navigate('/admin/meters')} className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-muted hover:text-primary transition-all active:scale-90">
               <ArrowLeft size={28} />
            </button>
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <h1 className="text-[36px] font-black text-slate-900 tracking-tighter leading-tight">{meter.meterCode}</h1>
                  <StatusBadge status={meter.meterStatus} />
               </div>
               <div className="flex items-center gap-4 text-small text-muted font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     {meter.meterType === 'Electricity' ? <Zap size={16} fill="currentColor" className="text-amber-500" /> : <Droplets size={16} fill="currentColor" className="text-blue-500" />}
                     {meter.meterType === 'Electricity' ? 'Điện' : 'Nước'}
                  </div>
                  <span>•</span>
                  <Link to={`/rooms/${meter.roomId}`} className="text-primary hover:underline">Phòng {meter.roomCode}</Link>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 shrink-0">
               <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">Chỉ số mới nhất (RULE-01)</p>
               <h2 className="text-[44px] font-black font-mono leading-none tracking-tighter">
                  {isLoadingLatest ? <Skeleton className="h-10 w-24 bg-white/10" /> : (latestReading?.currentIndex || 0).toLocaleString()}
               </h2>
               <p className="text-[11px] font-bold text-success-text mt-2 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} /> +12.4% vs tháng trước
               </p>
            </div>
            <div className="w-24 h-full relative z-10 opacity-60 group-hover:opacity-100 transition-all">
               <ResponsiveContainer width="100%" height={60}>
                  <BarChart data={chartData.slice(-6)}>
                     <Bar dataKey="consumption" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <History size={150} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
         </div>
      </div>

      {/* 5.4.2 Consumption Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 card-container p-8 bg-white/60 backdrop-blur-md border-border/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                     <Activity size={20} />
                  </div>
                  <div>
                     <h2 className="text-display-small text-slate-900 tracking-tight">Biểu đồ tiêu thụ</h2>
                     <p className="text-small text-muted font-medium">12 tháng gần nhất (Đơn vị: {meter.meterType === 'Electricity' ? 'kWh' : 'm3'})</p>
                  </div>
               </div>
               <div className="px-4 py-2 bg-bg rounded-xl border border-border/10">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted">TB: 154 {meter.meterType === 'Electricity' ? 'kWh' : 'm3'}</span>
               </div>
            </div>

            <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                     <XAxis 
                       dataKey="month" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                     />
                     <Tooltip 
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                     />
                     <Bar 
                       dataKey="consumption" 
                       fill="#3b82f6" 
                       radius={[8, 8, 0, 0]}
                       barSize={32}
                     >
                        {chartData.map((entry, index) => (
                          <Cell 
                           key={`cell-${index}`} 
                           fill={index === chartData.length - 1 ? '#2563eb' : '#3b82f6'} 
                          />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="card-container p-8 bg-slate-900 text-white flex flex-col justify-between border-none shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-[11px] font-black uppercase tracking-[4px] text-slate-400 mb-8">Thanh toán kỳ tới (Dự tính)</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[13px] font-bold text-slate-300">Tổng tiêu thụ</p>
                        <p className="text-[28px] font-black font-mono">142.5 <span className="text-[14px] text-slate-500 font-sans tracking-normal">kWh</span></p>
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-widest text-success-text mb-2">Đúng tiến độ</p>
                  </div>
                  <div className="h-[2px] bg-slate-800" />
                  <div>
                     <p className="text-[13px] font-bold text-slate-300">Thành tiền (Net)</p>
                     <p className="text-[40px] font-black tracking-tighter text-amber-500">427.500 <span className="text-[16px] text-slate-500 font-sans tracking-normal">VND</span></p>
                  </div>
               </div>
            </div>

            <button className="relative z-10 btn-primary w-full h-14 rounded-2xl bg-white text-slate-900 border-none hover:bg-slate-100 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[12px] group active:scale-95 transition-all">
               Xuất hóa đơn sớm
               <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <BarChart2 size={250} className="absolute -bottom-10 -left-10 text-white/5 rotate-6" />
         </div>
      </div>

      {/* 5.4.3 Readings DataTable */}
      <div className="card-container overflow-hidden bg-white border-border/10 shadow-xl">
         <div className="p-8 border-b border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center text-muted">
                  <LayoutList size={20} />
               </div>
               <h2 className="text-[20px] font-black text-slate-900 tracking-tight uppercase tracking-widest">Lịch sử ghi chỉ số</h2>
            </div>
            <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-primary bg-primary/5 px-5 h-11 rounded-full hover:bg-primary hover:text-white transition-all active:scale-95">
               <TrendingUp size={16} /> So sánh kỳ trước
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-bg text-[10px] font-black uppercase tracking-[3px] text-muted">
                     <th className="px-8 py-5">Kỳ tháng</th>
                     <th className="px-6 py-5">Ngày ghi</th>
                     <th className="px-6 py-5">Số trước</th>
                     <th className="px-6 py-5">Số hiện tại</th>
                     <th className="px-6 py-5">Tiêu thụ</th>
                     <th className="px-6 py-5">Người nhập</th>
                     <th className="px-6 py-5">Ảnh</th>
                     <th className="px-8 py-5 text-right">Edit</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoadingReadings ? (
                     Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/5">
                           <td colSpan={8} className="px-8 py-6"><Skeleton className="h-6 w-full" /></td>
                        </tr>
                     ))
                  ) : readings?.data?.length === 0 ? (
                     <tr><td colSpan={8} className="py-20 text-center text-muted font-black uppercase tracking-[4px]">Chưa có dữ liệu lịch sử</td></tr>
                  ) : readings?.data?.map((reading: MeterReading, idx: number) => {
                     const canEdit = hasPermission("meter.edit") && differenceInMinutes(new Date(), new Date(reading.createdAt)) <= 10;
                     
                     return (
                        <tr key={reading.id} className="border-b border-border/5 group hover:bg-bg/50 transition-all">
                           <td className="px-8 py-6">
                              <span className="text-[13px] font-black text-primary font-mono">{reading.monthYear}</span>
                              {idx === 0 && <span className="ml-2 px-2 py-0.5 bg-success-bg/20 text-success-text text-[9px] font-black uppercase tracking-tighter rounded">Mới nhất</span>}
                           </td>
                           <td className="px-6 py-6 text-small font-bold text-slate-500">28/02/2026</td>
                           <td className="px-6 py-6 font-mono text-muted text-[13px]">{reading.previousIndex.toLocaleString()}</td>
                           <td className="px-6 py-6 font-mono font-black text-slate-800 text-[15px]">{reading.currentIndex.toLocaleString()}</td>
                           <td className="px-6 py-6">
                              <div className="flex items-center gap-2">
                                 <span className="text-[14px] font-black text-success-text font-mono">{(reading.currentIndex - reading.previousIndex).toLocaleString()}</span>
                                 <span className="text-[11px] font-bold text-muted uppercase tracking-tighter">{meter.meterType === 'Electricity' ? 'kWh' : 'm3'}</span>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black">QT</div>
                                 <span className="text-small font-bold text-slate-600">Quản trị viên</span>
                              </div>
                           </td>
                           <td className="px-6 py-6">
                              <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-muted cursor-pointer hover:border-primary hover:text-primary transition-all overflow-hidden group/image active:scale-95">
                                 <Eye size={18} className="relative z-10" />
                                 <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-800/20 group-hover/image:opacity-100 opacity-0 transition-opacity" />
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              {canEdit ? (
                                 <button className="h-11 w-11 flex items-center justify-center text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm active:scale-90 ml-auto border border-primary/10">
                                    <Edit3 size={18} />
                                 </button>
                              ) : (
                                 <Clock size={16} className="text-muted/40 ml-auto" />
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
         <div className="p-6 bg-bg flex justify-center">
            <button className="flex h-11 px-8 items-center gap-2 text-[11px] font-black uppercase tracking-[3px] text-muted hover:text-primary transition-all active:scale-95">
               Xem toàn bộ lịch sử <ChevronRight size={14} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default MeterReadingHistory;
