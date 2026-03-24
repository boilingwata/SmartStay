declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    penColor?: string;
    backgroundColor?: string;
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    minDistance?: number;
    dotSize?: number | (() => number);
    onEnd?: (event: MouseEvent | TouchEvent) => void;
    onBegin?: (event: MouseEvent | TouchEvent) => void;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    getCanvas(): HTMLCanvasElement;
    getTrimmedCanvas(): HTMLCanvasElement;
    getSignaturePad(): any;
    fromDataURL(dataURL: string, options?: any): void;
    toDataURL(type?: string, encoderOptions?: any): string;
    fromData(pointGroups: any[]): void;
    toData(): any[];
    off(): void;
    on(): void;
    isEmpty(): boolean;
    clear(): void;
  }
}
