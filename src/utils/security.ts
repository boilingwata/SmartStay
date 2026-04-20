/**
 * Security utilities for URL sanitization and validation
 * Prevents XSS and loading content from untrusted remote sources
 */

export const TRUSTED_DOMAINS = [
  'cdn.smartstay.vn',
  'localhost',
  '127.0.0.1',
  'i.pravatar.cc', // Whitelisted for demo avatars
  'images.unsplash.com', // Added for amenity images
];

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop';


/**
 * Validates if a URL is safe to render in src or href
 * 1. Checks for common protocols (https only, no javascript:)
 * 2. Checks if the domain is in the trusted whitelist
 * 3. Allows blob: and data: urls for local previews if safe
 */
export const isSafeUrl = (url: string | undefined): boolean => {
  if (!url) return false;

  // 1. Block known dangerous protocols
  const lowerUrl = url.toLowerCase().trim();
  if (lowerUrl.startsWith('javascript:')) return false;
  if (lowerUrl.startsWith('data:')) {
    // Only allow data images, block other types
    return lowerUrl.startsWith('data:image/');
  }
  if (lowerUrl.startsWith('blob:')) return true; // Local previews are generally safe

  // 2. Protocol Check
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    // Relative paths are safe
    if (url.startsWith('/')) return true;
    return false;
  }

  // 3. Domain & Protocol Check
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Senior Architect Tip: Enforce HTTPS in production for remote trusted domains
    const isProd = import.meta.env.PROD;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isProd && urlObj.protocol === 'http:' && !isLocal) {
      console.warn(`[Security] Insecure HTTP URL blocked in production: ${url}`);
      return false;
    }
    
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }

};

/**
 * Returns a safe URL or a fallback image
 */
export const sanitizeUrl = (url: string | undefined, fallback: string = '/images/safe-fallback.png'): string => {
  if (isSafeUrl(url)) return url!;
  return fallback;
};

/**
 * Validates file integrity by checking magic bytes (demonstration)
 * Used in client-side pre-upload validation
 */
export const checkImageIntegrity = async (file: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target?.result) return resolve(false);
      const arr = new Uint8Array(e.target.result as ArrayBuffer).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, '0');
      }
      
      const isPng = header.startsWith("89504e47");
      const isJpeg = header.startsWith("ffd8ff");
      const isWebp = header.includes("52494646"); // RIFF header for WebP
      
      resolve(isPng || isJpeg || isWebp);
    };
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
};

export const checkPdfIntegrity = async (file: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target?.result) return resolve(false);
      const arr = new Uint8Array(e.target.result as ArrayBuffer).subarray(0, 5);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += String.fromCharCode(arr[i]);
      }

      resolve(header === '%PDF-');
    };
    reader.readAsArrayBuffer(file.slice(0, 5));
  });
};

export const checkOfficeDocumentIntegrity = async (file: Blob): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      if (!e.target?.result) return resolve(false);
      const arr = new Uint8Array(e.target.result as ArrayBuffer).subarray(0, 8);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, '0');
      }

      const isLegacyDoc = header.startsWith('d0cf11e0');
      const isDocxZip = header.startsWith('504b0304') || header.startsWith('504b0506') || header.startsWith('504b0708');
      resolve(isLegacyDoc || isDocxZip);
    };
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

/**
 * Strictly validates and normalizes a URL string. 
 * Only allows http: and https: protocols AND requires the host
 * to be on the TRUSTED_DOMAINS whitelist.
 * Returns the normalized href string or null if invalid.
 */
export const getNormalizedHttpUrl = (url?: unknown): string | null => {
  if (typeof url !== 'string' || !url.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    
    // 1. Protocol check
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      
      // 2. Strip credentials to prevent user:pass@host obfuscation
      parsed.username = '';
      parsed.password = '';
      
      // 3. Domain Whitelist check
      const hostname = parsed.hostname.toLowerCase();
      const isTrusted = TRUSTED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (isTrusted) {
        return parsed.href;
      } else {
        console.warn(`[Security] Untrusted URL domain blocked: ${hostname}`);
        return null;
      }
    }
    console.warn(`[Security] Invalid URL protocol blocked: ${parsed.protocol}`);
  } catch (e) {
    console.warn(`[Security] Malformed URL encountered and blocked.`);
  }
  return null;
};
