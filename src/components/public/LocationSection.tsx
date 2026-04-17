import React from 'react';
import { Link } from 'react-router-dom';

const CITIES = [
  {
    name: 'Hà Nội',
    img: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?auto=format&fit=crop&w=800&q=80',
    count: 67,
  },
  {
    name: 'Bình Dương',
    img: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80',
    count: 45,
  },
  {
    name: 'Đà Nẵng',
    img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    count: 32,
  },
  {
    name: 'TP. Hồ Chí Minh',
    img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80',
    count: 89,
  },
];

export const LocationSection: React.FC = () => (
  <section className="max-w-[1100px] mx-auto px-4 lg:px-0 py-4">
    <h2 className="text-[#0d6b5a] text-[30px] font-bold tracking-tight mb-4">
      &nbsp;Tìm phòng trọ theo địa điểm
    </h2>
    <div className="flex flex-wrap gap-5 justify-center py-6">
      {CITIES.map(({ name, img, count }) => (
        <Link
          key={name}
          to={`/listings?search=${encodeURIComponent(name)}`}
          className="relative w-full sm:w-[535px] h-[200px] rounded-[20px] overflow-hidden group cursor-pointer shrink-0 block"
        >
          <img
            src={img}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          {/* Text */}
          <div className="absolute bottom-[17px] left-0 right-0 px-[15px] text-[#e8f5f1]">
            <p className="text-[25px] font-bold leading-tight tracking-tight">{name}</p>
            <p className="text-[20px] font-normal leading-tight">
              Xem ngay còn {count}+ phòng còn trống
            </p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);
