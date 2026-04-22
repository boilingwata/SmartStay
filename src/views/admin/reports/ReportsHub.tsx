import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  Star, 
  Users, 
  Bell,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/utils';

const reportCards = [
  { 
    icon: Building2, 
    title: "Tỷ lệ Lấp đầy", 
    desc: "Lịch sử lấp đầy phòng theo tháng/quý/năm, trend chart", 
    route: "/owner/reports/occupancy",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  { 
    icon: TrendingUp, 
    title: "Tài chính", 
    desc: "Doanh thu, chi phí, lợi nhuận, cashflow", 
    route: "/owner/reports/financial",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    icon: AlertCircle, 
    title: "Công nợ", 
    desc: "Danh sách công nợ, phân tích tuổi nợ", 
    route: "/owner/reports/debt",
    color: "text-rose-600",
    bg: "bg-rose-50"
  },
  { 
    icon: RefreshCw, 
    title: "Vòng đời Phòng", 
    desc: "Thời gian trống, bảo trì, cho thuê, vacancy rate", 
    route: "/owner/reports/room-lifecycle",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  { 
    icon: Star, 
    title: "NPS & Hài lòng", 
    desc: "Điểm NPS trung bình, trend, phân bỏ", 
    route: "/owner/reports/nps",
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  { 
    icon: Users, 
    title: "Hiệu suất Nhân viên", 
    desc: "Rating NV, số ticket xử lý, thời gian xử lý TB", 
    route: "/owner/reports/staff",
    color: "text-cyan-600",
    bg: "bg-cyan-50"
  },
  { 
    icon: Bell, 
    title: "Cảnh báo Hệ thống", 
    desc: "AnalyticsAlerts theo severity, trend", 
    route: "/owner/reports/alerts",
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
];

const ReportsHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Báo cáo & Phân tích</h1>
        <p className="text-slate-500 mt-1 italic">Hệ thống tổng hợp dữ liệu thời gian thực cho vận hành SmartStay.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((report, idx) => (
          <div 
            key={idx}
            className="group card-container p-6 bg-white/60 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-primary/5 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                report.bg,
                report.color
              )}>
                <report.icon size={28} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-primary tracking-tight group-hover:text-secondary transition-colors">
                  {report.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 italic">
                  {report.desc}
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate(report.route)}
              className="mt-8 btn-primary w-full flex items-center justify-center gap-2 group/btn"
            >
              Xem báo cáo
              <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsHub;

