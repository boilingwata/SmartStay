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
  <section className="container mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-primary text-2xl sm:text-3xl font-bold tracking-tight mb-6">
      Tìm phòng trọ theo địa điểm
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {CITIES.map(({ name, img, count }) => (
        <Link
          key={name}
          to={`/listings?search=${encodeURIComponent(name)}`}
          className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden group block"
        >
          <img
            src={img}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Text */}
          <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-4 sm:px-6 text-white">
            <p className="text-xl sm:text-2xl font-bold leading-tight tracking-tight">{name}</p>
            <p className="text-base sm:text-lg font-normal leading-tight mt-1 opacity-90">
              Xem ngay {count}+ phòng còn trống
            </p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);
