declare module 'dompurify' {
  interface DOMPurify {
    sanitize(source: string | Node, config?: any): string;
    addHook(hook: string, callback: (node: Element, data: any, config: any) => void): void;
  }
  const dompurify: DOMPurify;
  export default dompurify;
}
