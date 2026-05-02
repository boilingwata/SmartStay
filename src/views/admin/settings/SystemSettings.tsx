import React, { useState } from 'react';
import { Settings, Save, Bell, Shield, Globe, Database, Server, Mail, Lock, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'notification' | 'security' | 'database'>('general');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setSaving(false);
    toast.success('Đã lưu cấu hình hệ thống thành công');
  };

  const tabs = [
    { id: 'general', label: 'Chung', icon: Globe },
    { id: 'notification', label: 'Thông báo', icon: Bell },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'database', label: 'Hệ thống', icon: Database },
  ] as const;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-600/20">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cài đặt Hệ thống</h1>
            <p className="text-slate-500 text-sm font-medium italic">Cấu hình tham số vận hành, thông báo và bảo mật.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saving}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 px-8 h-12"
        >
          <Save className="mr-2 h-4 w-4" /> Lưu cấu hình
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Tab: Chung */}
          {activeTab === 'general' && (
            <div className="card-container p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={18} className="text-indigo-600" /> Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tên hệ thống</label>
                    <input type="text" className="input-base w-full rounded-xl" defaultValue="SmartStay Cloud BMS" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Ngôn ngữ mặc định</label>
                    <select className="input-base w-full rounded-xl">
                      <option>Tiếng Việt (VN)</option>
                      <option>Tiếng Anh (US)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Server size={18} className="text-indigo-600" /> Trạng thái vận hành
                </h3>
                <div className="p-4 bg-amber-50 rounded-[24px] border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-pulse">
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800">Chế độ Bảo trì</p>
                      <p className="text-[10px] text-amber-600 font-medium">Nếu bật, chỉ quản trị tối cao mới có thể đăng nhập vào hệ thống.</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Thông báo */}
          {activeTab === 'notification' && (
            <div className="card-container p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={18} className="text-indigo-600" /> Cấu hình SMTP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Máy chủ SMTP</label>
                    <input type="text" className="input-base w-full" defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Cổng kết nối</label>
                    <input type="text" className="input-base w-full" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tài khoản gửi</label>
                    <input type="email" className="input-base w-full" defaultValue="no-reply@smartstay.vn" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Mật khẩu ứng dụng</label>
                    <input type="password" className="input-base w-full" defaultValue="••••••••••••" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Bảo mật */}
          {activeTab === 'security' && (
            <div className="card-container p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600" /> Chính sách Mật khẩu
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Yêu cầu ít nhất 8 ký tự', status: true },
                    { label: 'Yêu cầu ký tự đặc biệt & số', status: true },
                    { label: 'Bắt buộc đổi mật khẩu sau 90 ngày', status: false },
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <span className="text-xs font-bold text-slate-700">{rule.label}</span>
                      <div className={`w-10 h-5 rounded-full relative ${rule.status ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${rule.status ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Hệ thống */}
          {activeTab === 'database' && (
            <div className="card-container p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[32px] text-white">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider mb-1">Sao lưu lần cuối</h4>
                  <p className="text-xs text-slate-400">Hôm nay, lúc 03:00 sáng (Đã hoàn thành)</p>
                </div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <Download size={16} className="mr-2" /> Tải bản sao lưu
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar phụ */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-container p-6 bg-indigo-50 border-indigo-100">
            <h4 className="text-[10px] font-black uppercase text-indigo-700 tracking-widest mb-4">Mẹo cấu hình</h4>
            <p className="text-xs text-indigo-900/70 leading-relaxed font-medium">
              Thiết lập chính xác các tham số này giúp tối ưu hóa hiệu năng và đảm bảo an toàn dữ liệu cho dự án của bạn.
            </p>
          </div>

          <div className="card-container p-6 border-dashed border-2 border-slate-200 bg-slate-50/50">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Nhật ký thay đổi</h4>
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">Chủ sở hữu đã cập nhật cấu hình SMTP</p>
                    <p className="text-[9px] text-slate-400 font-mono italic">2 giờ trước</p>
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

export default SystemSettings;
