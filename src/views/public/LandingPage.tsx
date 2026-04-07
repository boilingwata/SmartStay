import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, CheckCircle2, ArrowRight, ShieldCheck,
  Zap, BarChart3, MessageSquare, Plus, ChevronDown,
  ChevronUp, Star, Layout, Smartphone, PieChart, Search, MapPin
} from 'lucide-react';
import { PublicTopbar, PublicFooter } from '../layouts/PublicComponents';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND } from '@/utils';
import publicListingsService from '@/services/publicListingsService';

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="card-container p-8 hover:shadow-xl transition-all border-none bg-white/50 backdrop-blur-sm group">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="text-h3 mb-2">{title}</h3>
    <p className="text-body text-muted">{desc}</p>
  </div>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button 
        className="w-full py-6 flex items-center justify-between text-left hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-h3 font-medium">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-96 pb-6" : "max-h-0"
      )}>
        <p className="text-body text-muted leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const TestimonialCard = ({ name, building, quote, avatar }: { name: string, building: string, quote: string, avatar: string }) => (
  <div className="card-container p-10 bg-white shadow-xl relative mt-10">
    <div className="absolute -top-10 left-10 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden">
      <img src={avatar} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="pt-8 space-y-4">
      <div className="flex gap-1 text-accent">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-body italic text-text leading-relaxed">"{quote}"</p>
      <div>
        <h4 className="text-h3 text-primary">{name}</h4>
        <p className="text-small text-muted">{building}</p>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const [listingSearch, setListingSearch] = useState('');

  const { data: previewListings = [] } = useQuery({
    queryKey: ['public-room-listings'],
    queryFn: () => publicListingsService.getListings(),
  });
  const [activeFAQTab, setActiveFAQTab] = useState('payment');

  const screenshots = {
    admin: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2026",
    resident: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=2070",
    report: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070"
  };

  return (
    <div className="bg-bg min-h-screen">
      <PublicTopbar />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-gradient-to-br from-primary via-[#2E5D9F] to-secondary">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <div className="text-white space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <StatusBadge status="Published" className="bg-white/10 text-white border-white/20 px-4" />
            <h1 className="text-[56px] font-display font-bold leading-[1.1] tracking-tight">
              Quản lý Toà nhà <br /> <span className="text-accent">Chuyên nghiệp</span> & <br /> Hiệu quả
            </h1>
            <p className="text-xl text-white/70 max-w-lg leading-relaxed">
              SmartStay BMS giải phóng ban quản lý khỏi các tác vụ thủ công. Tỉ lệ thu tống tăng 35%, sự hài lòng của cư dân tăng 50%.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/listings" className="px-8 py-4 bg-accent text-white rounded-md font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
                Bắt đầu miễn phí <ArrowRight size={20} />
              </Link>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-md font-bold text-lg hover:bg-white/20 transition-all">
                Xem Demo
              </button>
            </div>
          </div>
          <div className="hidden lg:block animate-in fade-in zoom-in duration-1000 delay-300">
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full"></div>
              <img 
                src={screenshots.admin} 
                alt="Bảng điều khiển SmartStay" 
                className="rounded-2xl shadow-2xl border-4 border-white/10 relative"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-20 -mt-10 relative z-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { val: '500+', label: 'Toà nhà vận hành', icon: Building2 },
              { val: '50.000+', label: 'Cư dân tin dùng', icon: Users },
              { val: '99.9%', label: 'Uptime hệ thống', icon: ShieldCheck },
              { val: '24/7', label: 'Hỗ trợ kỹ thuật', icon: MessageSquare },
            ].map((stat, i) => (
              <div key={i} className="card-container p-8 text-center hover:-translate-y-2 transition-transform duration-500">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                  <stat.icon size={24} />
                </div>
                <p className="text-display text-primary">{stat.val}</p>
                <p className="text-body text-muted font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h4 className="text-label text-accent font-bold">TÍNH NĂNG ƯU VIỆT</h4>
            <h2 className="text-display text-primary">Giải pháp chuyển đổi số toàn diện</h2>
            <p className="text-body text-muted max-w-2xl mx-auto">Tất cả những gì bạn cần để quản lý một hoặc hàng trăm toà nhà cùng lúc trên một nền tảng duy nhất.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Layout} title="Quản lý Hợp đồng" desc="Tự động hóa chu trình ký kết, gia hạn và lưu trữ hồ sơ cư dân bảo mật." />
            <FeatureCard icon={Zap} title="Hóa đơn Tự động" desc="Chốt số điện nước qua mobile app và gửi hóa đơn tức thì qua Zalo/Email." />
            <FeatureCard icon={Smartphone} title="Cổng Cư dân (Portal)" desc="App riêng cho cư dân: Thanh toán, phản ánh kiến nghị, và nhận thông báo." />
            <FeatureCard icon={Building2} title="Quản lý Đa toà nhà" desc="Quản lý tập trung nhiều dự án với phân quyền nhân sự chi tiết theo role." />
            <FeatureCard icon={PieChart} title="Báo cáo Analytics" desc="Hệ thống báo cáo tài chính, công nợ, và tỷ lệ lấp đầy trực quan realtime." />
            <FeatureCard icon={ShieldCheck} title="Bảo mật Enterprise" desc="Dữ liệu mã hóa AES-256 trên nền tảng Cloud, backup định kỳ hàng giờ." />
          </div>
        </div>
      </section>

      {/* 3.5 TENANT DISCOVERY */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <h4 className="text-label text-accent font-bold uppercase tracking-widest">Đang tìm nơi ở mới?</h4>
            <h2 className="text-display text-primary">Khám phá các căn hộ đang trống</h2>
            <p className="text-body text-muted max-w-lg mx-auto">Duyệt phòng không cần tài khoản. Đăng ký chỉ khi bạn sẵn sàng.</p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(listingSearch.trim() ? `/listings?search=${encodeURIComponent(listingSearch.trim())}` : '/listings');
            }}
            className="flex gap-3 max-w-xl mx-auto mb-12"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                placeholder="Tìm kiếm căn hộ..."
                className="input-base w-full pl-12 h-14 font-medium"
              />
            </div>
            <button type="submit" className="btn-primary h-14 px-6 font-bold flex items-center gap-2 shrink-0">
              Tìm kiếm
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Preview cards */}
          {previewListings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {previewListings.slice(0, 3).map((listing) => (
                <Link
                  key={listing.roomId}
                  to={`/listings/${listing.roomId}`}
                  className="card-container p-6 bg-white hover:shadow-xl transition-all border border-border group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0D8A8A] bg-[#0D8A8A]/10 px-2.5 py-1 rounded-full">
                      {listing.availabilityLabel}
                    </span>
                    <ArrowRight size={14} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-h3 font-black mb-1">{listing.roomCode}</h3>
                  <p className="text-small text-muted mb-4">{listing.roomType} · {listing.buildingName}</p>
                  <div className="flex items-start gap-2 text-small text-muted mb-4">
                    <MapPin size={14} className="mt-0.5 text-[#0D8A8A] shrink-0" />
                    <span className="line-clamp-1">{listing.buildingAddress}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted">Giá thuê</p>
                      <p className="font-black text-primary">{formatVND(listing.baseRent)}<span className="text-small font-medium text-muted">/tháng</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted">Diện tích</p>
                      <p className="font-bold text-slate-700">{listing.areaSqm} m²</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link to="/listings" className="btn-primary inline-flex items-center gap-2 px-8 py-4 font-bold">
              Xem tất cả phòng trống
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 bg-bg overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-display text-primary">3 bước vận hành toà nhà tự động</h2>
          </div>
          <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-0 justify-between items-center px-10">
            <div className="hidden lg:block absolute top-1/2 left-40 right-40 h-0.5 border-t-2 border-dashed border-primary/20 -translate-y-10"></div>
            {[
              { step: '01', title: 'Thiết lập toà nhà', desc: 'Import dữ liệu căn hộ và danh mục phí dịch vụ', icon: Building2 },
              { step: '02', title: 'Kết nối cư dân', desc: 'Gửi link truy cập portal và ký hợp đồng điện tử', icon: Users },
              { step: '03', title: 'Thu phí tự động', desc: 'Hệ thống tự động nhắc nợ và gạch nợ qua ngân hàng', icon: Zap },
            ].map((item, i) => (
              <div key={i} className="relative z-10 w-full lg:w-72 text-center group">
                <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg border border-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <item.icon size={32} />
                </div>
                <div className="absolute top-0 right-1/2 translate-x-12 -translate-y-4 bg-accent text-white text-small font-bold px-3 py-1 rounded-full">{item.step}</div>
                <h3 className="text-h3 mb-3">{item.title}</h3>
                <p className="text-body text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SCREENSHOTS GALLERY */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-display text-primary">Giao diện trực quan</h2>
            <div className="flex justify-center gap-4">
              {[
                { id: 'admin', label: 'Quản lý' },
                { id: 'resident', label: 'Cư dân' },
                { id: 'report', label: 'Báo cáo' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-6 py-2 rounded-full text-small font-bold transition-all",
                    activeTab === tab.id ? "bg-primary text-white shadow-lg" : "bg-bg text-muted hover:bg-primary/10"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative group max-w-5xl mx-auto">
            <div className="bg-[#1A1A2E] p-3 rounded-2xl shadow-2xl border-x-4 border-t-4 border-[#2E2E4E]">
              <div className="flex gap-1.5 mb-3 px-2">
                <div className="w-3 h-3 rounded-full bg-danger"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-success"></div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img 
                  src={(screenshots as any)[activeTab]} 
                  alt="SmartStay Screenshot" 
                  className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-24 bg-bg">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-display text-primary">Tin tưởng bởi hàng ngàn quản lý</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Lê Minh Tâm" 
              building="Vinhome Ocean Park" 
              avatar="https://i.pravatar.cc/150?u=1"
              quote="Từ khi dùng SmartStay, gánh nặng chốt số điện nước mỗi tháng đã không còn. Hệ thống tự động hoàn toàn." 
            />
            <TestimonialCard 
              name="Hoàng Thu Trang" 
              building="The Manor" 
              avatar="https://i.pravatar.cc/150?u=2"
              quote="Portal cư dân rất hiện đại, cư dân phản hồi rất tốt vì thanh toán nhanh và minh bạch ngay trên app." 
            />
            <TestimonialCard 
              name="Nguyễn Quốc Anh" 
              building="Goldmark City" 
              avatar="https://i.pravatar.cc/150?u=3"
              quote="Báo cáo tài chính cực kỳ chi tiết, giúp tôi nắm bắt tình hình công nợ toàn tòa nhà chỉ trong 1 click." 
            />
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-display text-primary">Câu hỏi thường gặp</h2>
            <div className="flex justify-center gap-6 mt-8 border-b">
              {['payment', 'feature', 'security'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveFAQTab(tab)}
                  className={cn(
                    "pb-4 text-small font-bold uppercase tracking-widest transition-all px-4",
                    activeFAQTab === tab ? "text-primary border-b-2 border-primary" : "text-muted border-b-2 border-transparent"
                  )}
                >
                  {tab === 'payment' ? 'Thanh toán' : tab === 'feature' ? 'Tính năng' : 'Bảo mật'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {activeFAQTab === 'payment' && (
              <>
                <FAQItem question="Hệ thống hỗ trợ những phương thức thanh toán nào?" answer="Chúng tôi tích hợp VNPay, Momo, ZaloPay và Chuyển khoản ngân hàng định danh (Virtual Account) để tự động gạch nợ." />
                <FAQItem question="Có tính phí theo số lượng căn hộ không?" answer="Có, chi phí được tối ưu theo các gói Starter/Pro dựa trên số lượng căn hộ anh quản lý." />
              </>
            )}
            {activeFAQTab === 'feature' && (
              <>
                <FAQItem question="Tôi có thể quản lý nhiều tòa nhà cùng lúc không?" answer="Hoàn toàn được. Gói Professional và Enterprise cho phép quản lý không giới hạn số lượng tòa nhà tập trung." />
                <FAQItem question="Cư dân có cần cài đặt app không?" answer="Portal cư dân chạy trực tuyến trên trình duyệt mobile hoặc có thể cài đặt như một ứng dụng PWA mà không cần qua Store." />
              </>
            )}
            {activeFAQTab === 'security' && (
              <>
                <FAQItem question="Dữ liệu của tôi có được an toàn không?" answer="Dữ liệu được mã hóa AES-256 và lưu trữ trên hệ thống Cloud của AWS với cơ chế backup hàng giờ." />
                <FAQItem question="Tôi có thể xuất dữ liệu ra Excel được không?" answer="Mọi báo cáo trong hệ thống đều hỗ trợ xuất ra định dạng Excel và PDF chuẩn xác." />
              </>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
