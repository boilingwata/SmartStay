import React from 'react';
import { ArrowRight, Building2, Shield, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const shortcuts = [
  {
    title: 'Tổ chức',
    description: 'Xem và quản lý các chủ sở hữu, không gian làm việc và cấu hình liên quan.',
    href: '/super-admin/organizations',
    icon: Building2,
  },
  {
    title: 'Rủi ro & Kiểm toán',
    description: 'Theo dõi hoạt động nhạy cảm, hỗ trợ điều tra và giám sát tuân thủ trên toàn hệ thống.',
    href: '/super-admin/audit',
    icon: Shield,
  },
  {
    title: 'Cài đặt nền tảng',
    description: 'Thiết lập chính sách, tích hợp và thông số vận hành ở cấp toàn nền tảng.',
    href: '/super-admin/settings',
    icon: Settings,
  },
];

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-border/70 bg-card p-8 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">Quản trị tối cao</p>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Điều hành và giám sát toàn nền tảng.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              Tập trung vào tổ chức, kiểm toán và cấu hình cấp nền tảng. Các mục dưới đây dẫn tới không gian làm việc
              tương ứng.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/super-admin/organizations"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground transition-all hover:bg-primary/95"
            >
              Quản lý tổ chức
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/super-admin/audit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-foreground transition-all hover:border-primary/25 hover:text-primary"
            >
              Kiểm toán & rủi ro
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {shortcuts.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)] transition-all hover:-translate-y-1 hover:border-primary/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <item.icon size={22} />
            </div>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-muted">Đi tới</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
              Tiếp tục
              <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">Phạm vi trách nhiệm</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Những việc thường làm tại đây</h2>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-muted">
            <li className="rounded-[22px] bg-background/70 px-4 py-4">
              Duy trì danh sách tổ chức và đảm bảo mỗi không gian làm việc được cấu hình đúng chính sách.
            </li>
            <li className="rounded-[22px] bg-background/70 px-4 py-4">
              Xem xét nhật ký và tín hiệu rủi ro để hỗ trợ đội vận hành xử lý sự cố hoặc yêu cầu tuân thủ.
            </li>
            <li className="rounded-[22px] bg-background/70 px-4 py-4">
              Cập nhật thiết lập nền tảng khi có thay đổi về gói dịch vụ, tích hợp hoặc thông số hệ thống.
            </li>
          </ul>
        </article>

        <article className="rounded-[30px] border border-border/70 bg-card p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">Lưu ý</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Tách biệt với không gian chủ nhà</h2>
          <p className="mt-6 text-sm leading-7 text-muted">
            Chủ nhà và nhân sự nội bộ làm việc trong không gian quản lý riêng (đường dẫn chủ sở hữu). Không gian này chỉ
            dành cho vai trò quản trị tối cao khi cần can thiệp hoặc cấu hình ở cấp toàn hệ thống.
          </p>
        </article>
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
