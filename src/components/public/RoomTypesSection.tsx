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
    <div className="rounded-3xl border border-border/55 bg-card/90 p-6 text-card-foreground shadow-[0_16px_48px_-24px_rgba(13,107,90,0.14)] backdrop-blur-[2px] sm:p-8 dark:bg-card">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        Các loại phòng
      </h2>
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4">
        {TYPES.map(({ label, type, img }) => (
          <Link
            key={type}
            to={`/listings?roomType=${type}`}
            className="group flex items-center gap-4 rounded-2xl p-3 transition-all duration-300 ease-out hover:bg-primary/[0.045] motion-reduce:transition-none"
          >
            <img
              src={img}
              alt={label}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-black/[0.04] transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none sm:h-24 sm:w-24"
              loading="lazy"
            />
            <span className="text-lg font-bold text-primary transition-colors duration-300 group-hover:text-primary/90 sm:text-xl">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
);
