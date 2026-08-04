import * as React from 'react';
import './IconButton.css';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'ghost' | 'solid';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — used for aria-label and title since the button is icon-only. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  active?: boolean;
}

function IconButton({
  children,
  label,
  size = 'md',
  variant = 'ghost',
  active = false,
  className = '',
  ...rest
}: IconButtonProps) {
  const cls = [
    'sfw-iconbtn',
    `sfw-iconbtn--${size}`,
    variant === 'solid' ? 'sfw-iconbtn--solid' : '',
    active ? 'sfw-iconbtn--active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export default IconButton;
