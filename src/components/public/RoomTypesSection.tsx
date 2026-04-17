import React from 'react';
import { Link } from 'react-router-dom';

const TYPES = [
  {
    label: 'Phòng trọ',
    type: 'room',
    img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Chung cư mini',
    type: 'apartment',
    img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Mặt bằng',
    type: 'retail',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Nhà phố',
    type: 'house',
    img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=200&q=80',
  },
];

export const RoomTypesSection: React.FC = () => (
  <div className="max-w-[1100px] mx-auto px-4 lg:px-0 py-4">
    <div className="bg-white rounded-[20px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] px-4 py-5">
      <h2 className="text-[#0d6b5a] text-[30px] font-bold tracking-tight mb-2 pl-4">
        Các loại phòng
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TYPES.map(({ label, type, img }) => (
          <Link
            key={type}
            to={`/listings?roomType=${type}`}
            className="flex items-center gap-3 px-[5px] py-3 rounded-xl hover:bg-[#e8f5f1] transition-colors group"
          >
            <img
              src={img}
              alt={label}
              className="w-[100px] h-[100px] rounded-[15px] object-cover shrink-0"
              loading="lazy"
            />
            <span className="text-[#0d6b5a] text-[20px] font-bold whitespace-nowrap group-hover:underline">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
