import React, { useState } from 'react';
import { sanitizeUrl, DEFAULT_FALLBACK_IMAGE } from '@/utils/security';
import { cn } from '@/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className, 
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  ...props 
}) => {
  const sanitizedSrc = sanitizeUrl(src, fallbackSrc);
  const [imgSrc, setImgSrc] = useState(sanitizedSrc);
  const [error, setError] = useState(false);

  const handleError = () => {
    if (!error) {
      setImgSrc(fallbackSrc);
      setError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn(className, error && "opacity-90 grayscale-[0.2]")}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
