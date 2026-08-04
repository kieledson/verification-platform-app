import * as React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Element or component to render as. Defaults to 'button'. */
  as?: React.ElementType;
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
  iconLeft,
  iconRight,
  as = 'button',
  className = '',
  ...rest
}: ButtonProps) {
  const Tag = as as React.ElementType;
  const cls = ['sfw-btn', `sfw-btn--${variant}`, `sfw-btn--${size}`, block ? 'sfw-btn--block' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={cls} {...rest}>
      {iconLeft}
      {children != null && <span>{children}</span>}
      {iconRight}
    </Tag>
  );
}

export default Button;
