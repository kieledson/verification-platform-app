import * as React from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'solid';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

function Badge({ children, tone = 'neutral', dot = false, className = '', ...rest }: BadgeProps) {
  const cls = ['sfw-badge', `sfw-badge--${tone}`, dot ? 'sfw-badge--dot' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
