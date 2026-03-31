const MOJIBAKE_TOKENS = [
  'Ã¡',
  'Ã¢',
  'Ã£',
  'Ã¨',
  'Ã©',
  'Ãª',
  'Ã¬',
  'Ã­',
  'Ã²',
  'Ã³',
  'Ã´',
  'Ãµ',
  'Ã¹',
  'Ãº',
  'Ã½',
  'Ãƒ',
  'Ã‚',
  'Ä‘',
  'Æ°',
  'á»',
  'áº',
  'â€',
  'Â·',
  'Â ',
];

export const hasLikelyMojibake = (value: string | null | undefined): value is string => {
  if (typeof value !== 'string' || value.length === 0) return false;
  return MOJIBAKE_TOKENS.some((token) => value.includes(token));
};

export const assertNoLikelyMojibake = (
  record: Record<string, string | null | undefined>,
  labels?: Record<string, string>,
) => {
  const offenders = Object.entries(record)
    .filter(([, value]) => hasLikelyMojibake(value))
    .map(([key]) => labels?.[key] ?? key);

  if (offenders.length === 0) return;

  throw new Error(
    `Phát hiện văn bản bị lỗi mã hóa ở: ${offenders.join(', ')}. Vui lòng nhập lại bằng tiếng Việt UTF-8.`,
  );
};
