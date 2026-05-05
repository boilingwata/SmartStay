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
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 sm:p-8">
      <h2 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight mb-6">
        Các loại phòng
      </h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {TYPES.map(({ label, type, img }) => (
          <Link
            key={type}
            to={`/listings?roomType=${type}`}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/5 transition-colors group"
          >
            <img
              src={img}
              alt={label}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0"
              loading="lazy"
            />
            <span className="text-primary text-lg sm:text-xl font-bold group-hover:underline">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
