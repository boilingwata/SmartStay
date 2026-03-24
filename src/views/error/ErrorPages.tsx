import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ghost, ShieldAlert, Cpu, Gavel, Home, ArrowLeft, PhoneCall } from 'lucide-react';

interface ErrorViewProps {
  icon: any;
  code: string;
  title: string;
  desc: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

const ErrorBase: React.FC<ErrorViewProps> = ({ icon: Icon, code, title, desc, primaryAction, secondaryAction }) => (
  <div className="min-h-screen bg-bg flex items-center justify-center p-10 text-center animate-in fade-in duration-500">
    <div className="max-w-md w-full space-y-8">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
        <Icon size={120} className="text-primary/10 relative" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[100px] font-black font-display text-primary/20 select-none">
          {code}
        </span>
      </div>

      <div className="space-y-4">
        <h1 className="text-[32px] font-display font-bold text-primary">{title}</h1>
        <p className="text-body text-muted leading-relaxed">
          {desc}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        {primaryAction && (
          <button 
            onClick={primaryAction.onClick}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-md font-bold shadow-lg hover:bg-primary-light transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} /> {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick}
            className="w-full sm:w-auto px-8 py-3.5 border border-primary/20 text-primary rounded-md font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  </div>
);

// 3.3 Error Pages Implementation
export const Error404 = () => {
  const navigate = useNavigate();
  return (
    <ErrorBase 
      icon={Ghost} 
      code="404" 
      title="Trang không tồn tại" 
      desc="Tòa nhà này dường như chưa được xây dựng hoặc đường dẫn đã bị lỗi. Vui lòng kiểm tra lại URL."
      primaryAction={{ label: "Về trang chủ", onClick: () => navigate('/') }}
      secondaryAction={{ label: "Quay lại", onClick: () => navigate(-1) }}
    />
  );
};

export const Error403 = () => {
  const navigate = useNavigate();
  return (
    <ErrorBase 
      icon={ShieldAlert} 
      code="403" 
      title="Không có quyền truy cập" 
      desc="Bạn đang cố gắng vào khu vực bảo mật. Vui lòng liên hệ Quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn."
      primaryAction={{ label: "Về Dashboard", onClick: () => navigate('/') }}
      secondaryAction={{ label: "Liên hệ hỗ trợ", onClick: () => {} }}
    />
  );
};

export const Error500 = () => (
  <ErrorBase 
    icon={Cpu} 
    code="500" 
    title="Lỗi hệ thống" 
    desc="Máy chủ đang gặp sự cố kỹ thuật. Đừng lo lắng, dữ liệu của bạn vẫn an toàn. Chúng tôi đang xử lý ngay."
    primaryAction={{ label: "Thử lại ngay", onClick: () => window.location.reload() }}
    secondaryAction={{ label: "Báo cáo lỗi", onClick: () => {} }}
  />
);

export const MaintenancePage = ({ estimatedTime = "14:00 07/03/2026" }: { estimatedTime?: string }) => (
  <ErrorBase 
    icon={Gavel} 
    code="SYS" 
    title="Hệ thống đang bảo trì" 
    desc={`Chúng tôi đang nâng cấp Command Center để mang lại trải nghiệm tốt hơn. Dự kiến hoàn thành lúc: ${estimatedTime}.`}
    primaryAction={{ label: "Kiểm tra lại", onClick: () => window.location.reload() }}
    secondaryAction={{ label: "Hotline 24/7", onClick: () => {} }}
  />
);
