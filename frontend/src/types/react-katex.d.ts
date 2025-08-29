declare module 'react-katex' {
  import { FC, ReactNode } from 'react';

  interface KatexProps {
    children?: ReactNode;
    math?: string;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
  }

  export const InlineMath: FC<KatexProps>;
  export const BlockMath: FC<KatexProps>;
}