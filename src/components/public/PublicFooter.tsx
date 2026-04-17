import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => (
  <footer className="bg-white border-t border-black/10">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-16 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-30">
      {/* Brand */}
      <div className="flex-1 min-w-0 space-y-4">
        <span className="text-[#0d6b5a] text-2xl font-semibold">SmartStay</span>
        <p className="text-[#0d6b5a]/55 text-base font-medium max-w-md leading-relaxed">
          SmartStay kết nối chủ nhà và cư dân trên một nền tảng quản lý cho thuê hiện đại.
          Quản lý tòa nhà, hợp đồng, hóa đơn và yêu cầu hỗ trợ — nhanh chóng, minh bạch và
          không cần giấy tờ.
        </p>
      </div>

      {/* Nav columns */}
      <div className="flex gap-10 shrink-0">
        {/* Spacer column (matches Figma layout) */}
        <div className="hidden lg:block w-[130px]" />

        <nav className="w-[130px] flex flex-col gap-2">
          <div className="pb-4">
            <span className="text-[#0d6b5a] text-base font-semibold">Hỗ trợ</span>
          </div>
          <a
            href="mailto:hello@smartstay.vn"
            className="text-[#0d6b5a]/55 text-base font-medium hover:text-[#0d6b5a] transition-colors"
          >
            Liên hệ
          </a>
          <Link
            to="/listings"
            className="text-[#0d6b5a]/55 text-base font-medium hover:text-[#0d6b5a] transition-colors"
          >
            Ticket
          </Link>
          <span className="text-[#0d6b5a]/55 text-base font-medium cursor-default select-none">
            Pháp lý
          </span>
        </nav>
      </div>
    </div>

    <div className="border-t border-black/5">
      <p className="max-w-[1280px] mx-auto px-6 lg:px-16 py-4 text-xs text-[#0d6b5a]/40">
        © {new Date().getFullYear()} SmartStay. All rights reserved.
      </p>
    </div>
  </footer>
);
