import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, Clock, User, ArrowLeft, Filter, 
  Calendar, CheckCircle2, MessageSquare,
  TrendingUp, Award, ThumbsUp
} from 'lucide-react';
import { 
  RadialBarChart, RadialBar, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const StaffRatings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ['staff-ratings', id],
    queryFn: () => ticketService.getStaffRatings(id!)
  });



  if (isLoading || !ratingsData) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[4px] text-muted">Auditing Performance...</p>
      </div>
    );
  }

  const { average, summary, list } = ratingsData;

  // Data for RadialBarChart
  const radialData = [
    { name: 'Rating', value: (average / 5) * 100, fill: '#EAB308' }
  ];

  // Data for Histogram
  const histogramData = [
    { star: '5 sao', count: summary[5], fill: '#22C55E' },
    { star: '4 sao', count: summary[4], fill: '#84CC16' },
    { star: '3 sao', count: summary[3], fill: '#EAB308' },
    { star: '2 sao', count: summary[2], fill: '#F97316' },
    { star: '1 sao', count: summary[1], fill: '#DC2626' }
  ].reverse();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
         <button 
           onClick={() => navigate(-1)}
           className="flex items-center gap-3 text-muted hover:text-primary transition-all group"
         >
           <div className="p-2.5 group-hover:bg-primary/5 rounded-2xl transition-all">
              <ArrowLeft size={20} />
           </div>
           <span className="text-small font-black uppercase tracking-widest underline decoration-transparent group-hover:decoration-primary/30 underline-offset-8">Trở lại</span>
         </button>

         <div className="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-border/10 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 border-r border-border/10">
               <Calendar size={16} className="text-muted" />
               <input type="date" className="bg-transparent text-[11px] font-bold outline-none" />
               <span className="text-muted opacity-30 mx-1">-</span>
               <input type="date" className="bg-transparent text-[11px] font-bold outline-none" />
            </div>
            <button className="p-2 hover:bg-bg rounded-xl transition-all"><Filter size={18} /></button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Staff Card & KPIs */}
        <div className="lg:col-span-4 space-y-8">
           <div className="card-container p-10 bg-primary text-white space-y-8 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="relative mb-6">
                    <img src={list[0]?.staffAvatar || 'https://i.pravatar.cc/150'} className="w-32 h-32 rounded-[40px] object-cover border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-success rounded-2xl flex items-center justify-center border-4 border-primary shadow-lg">
                       <Award size={18} />
                    </div>
                 </div>
                 <h2 className="text-h2 font-black tracking-tight mb-2">Lê Kỹ Thuật</h2>
                 <p className="text-small text-white/60 font-black uppercase tracking-[3px]">Senior Maintenance Staff</p>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-4">
                 <div className="bg-white/10 p-5 rounded-3xl border border-white/10 text-center">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Total Ratings</p>
                    <p className="text-[20px] font-black">{list.length}</p>
                 </div>
                 <div className="bg-white/10 p-5 rounded-3xl border border-white/10 text-center">
                    <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Tickets Case</p>
                    <p className="text-[20px] font-black">152</p>
                 </div>
              </div>
              <Award size={200} className="absolute -top-10 -right-10 text-white/5 rotate-12" />
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 gap-6">
              <div className="card-container p-8 space-y-6">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[3px] text-muted">Chỉ số hài hước</h4>
                    <TrendingUp size={16} className="text-success" />
                 </div>
                 <div className="flex items-end gap-3">
                    <span className="text-[48px] font-black text-primary leading-none">{average}</span>
                    <span className="text-h3 text-muted mb-1">/ 5.0</span>
                 </div>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={20} fill={s <= Math.round(average) ? "#EAB308" : "none"} className={s <= Math.round(average) ? "text-yellow-500" : "text-muted opacity-20"} />
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Charts & Details */}
        <div className="lg:col-span-8 space-y-10">
           {/* Charts Row */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card-container p-8 flex flex-col justify-center items-center shadow-2xl shadow-primary/5">
                 <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={radialData}>
                          <RadialBar background dataKey="value" cornerRadius={30} />
                       </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <p className="text-[10px] font-black text-muted uppercase tracking-widest">Efficiency</p>
                       <p className="text-[32px] font-black text-primary">{(average/5*100).toFixed(0)}%</p>
                    </div>
                 </div>
                 <p className="text-[10px] font-black uppercase text-muted tracking-widest mt-4">Điểm trung bình hệ thống</p>
              </div>

              <div className="card-container p-8 shadow-2xl shadow-primary/5 h-[280px]">
                 <p className="text-[11px] font-black uppercase tracking-[3px] text-muted mb-6">Phân phối xếp hạng</p>
                 <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={histogramData} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="star" type="category" width={50} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                       <Tooltip cursor={{fill: 'transparent'}} />
                       <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                          {histogramData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Ratings List */}
           <div className="space-y-6">
              <h3 className="text-h3 text-primary font-black uppercase tracking-widest flex items-center gap-3">
                 <ThumbsUp size={24} />
                 Đánh giá chi tiết
              </h3>
              
              <div className="space-y-4">
                 {list.map((rating: any) => (
                    <div key={rating.id} className="card-container p-8 bg-white shadow-xl shadow-primary/5 border-border/10 hover:shadow-2xl transition-all group">
                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="flex gap-6">
                             <img src={`https://i.pravatar.cc/150?u=${rating.tenantId}`} className="w-14 h-14 rounded-2xl object-cover shrink-0 grayscale group-hover:grayscale-0 transition-all border-4 border-white shadow-lg" alt="" />
                             <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                   <span className="text-small font-black text-primary">{rating.tenantName}</span>
                                   <span className="text-[10px] text-muted font-bold flex items-center gap-1.5"><Clock size={12} /> {format(parseISO(rating.createdAt), 'dd MMMM yyyy HH:mm', { locale: vi })}</span>
                                </div>
                                <div className="flex gap-1">
                                   {[1,2,3,4,5].map(s => (
                                     <Star key={s} size={14} fill={s <= rating.rating ? "#EAB308" : "none"} className={s <= rating.rating ? "text-yellow-500" : "text-muted opacity-20"} />
                                   ))}
                                </div>
                                <p className="text-body font-medium italic text-primary leading-relaxed">"{rating.comment}"</p>
                             </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-3">
                             <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Liên quan ticket</p>
                                <button 
                                  onClick={() => navigate(`/tickets/${rating.ticketId}`)}
                                  className="text-small font-mono font-black text-primary group-hover:underline"
                                >
                                   #{rating.ticketCode}
                                </button>
                             </div>
                             <div className="p-2 bg-success/10 text-success rounded-xl">
                                <CheckCircle2 size={16} />
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRatings;
