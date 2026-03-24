import React from 'react';
import { TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { TenantFeedback, NPSSurvey } from '@/models/Tenant';
import { formatDate, cn } from '@/utils';

interface FeedbackTabProps {
  feedback: TenantFeedback[] | undefined;
  nps: NPSSurvey[] | undefined;
}

export const FeedbackTab: React.FC<FeedbackTabProps> = ({ feedback, nps }) => {
  const getNPSColor = (score: number) => {
    if (score >= 9) return 'text-success';
    if (score >= 7) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
      {/* NPS Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 card-container p-10 bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center mb-6">
            <span className="text-display font-black">9.2</span>
          </div>
          <h3 className="text-h3 font-black tracking-widest mb-2">Chỉ số NPS</h3>
          <p className="text-small text-white/60 mb-8 italic">Average score from 5 surveys</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-success w-[92%] shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          </div>
          <div className="flex justify-between w-full mt-3 text-[10px] font-black uppercase text-white/40">
            <span>Promoter</span>
            <span>High Performance</span>
          </div>
        </div>

        <div className="lg:col-span-8 card-container p-8 bg-white/60">
          <h3 className="text-label text-muted font-black uppercase tracking-widest mb-8 border-b pb-4 flex items-center justify-between">
            Lịch sử khảo sát NPS
            <TrendingUp size={16} className="text-success" />
          </h3>
          <div className="space-y-6">
            {nps?.map(item => (
              <div key={item.id} className="flex gap-6 pb-6 border-b border-border/10 last:border-0 border-dashed">
                <div className={cn("text-h2 font-black shrink-0", getNPSColor(item.score))}>{item.score}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <p className="text-small font-black text-primary uppercase">{item.triggerType}</p>
                    <span className="text-[10px] text-muted italic">{formatDate(item.scoreDate)}</span>
                  </div>
                  <p className="text-small text-muted italic leading-relaxed">"{item.comment}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Phản hồi & Khiếu nại</h3>
          <button className="btn-outline-sm">+ Gửi phản hồi thay</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedback?.map(f => (
            <div key={f.id} className="card-container p-6 bg-white/60 hover:shadow-xl transition-all border-l-4 border-l-primary group">
              <div className="flex justify-between items-start mb-4">
                <div className="px-2 py-1 bg-primary/5 text-primary text-[9px] font-black rounded uppercase">{f.feedbackType}</div>
                <div className="flex items-center gap-2">
                  {f.isResolved ? (
                    <span className="flex items-center gap-1 text-success text-[10px] font-bold uppercase"><CheckCircle2 size={12} /> Đã xử lý</span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning text-[10px] font-bold uppercase"><AlertCircle size={12} /> Chờ xử lý</span>
                  )}
                </div>
              </div>
              <p className="text-body font-medium text-slate-700 leading-relaxed mb-6 group-hover:text-primary transition-colors italic">"{f.content}"</p>
              <div className="flex justify-between items-center text-[10px] text-muted border-t border-dashed pt-4">
                <span className="font-bold uppercase tracking-widest">ID: {f.id}</span>
                <span className="font-mono italic">{formatDate(f.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
