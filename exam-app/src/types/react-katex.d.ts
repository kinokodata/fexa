declare module 'react-katex' {
  import { ComponentType } from 'react';

  interface BlockMathProps {
    math: string;
    errorColor?: string;
    renderError?: (error: any) => JSX.Element;
    settings?: any;
  }

  interface InlineMathProps {
    math: string;
    errorColor?: string;
    renderError?: (error: any) => JSX.Element;
    settings?: any;
  }

  export const BlockMath: ComponentType<BlockMathProps>;
  export const InlineMath: ComponentType<InlineMathProps>;
}