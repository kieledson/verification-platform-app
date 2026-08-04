import * as React from 'react';
import './Card.css';

export type CardElevation = 'none' | 'sm' | 'md';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  padding?: CardPadding;
  interactive?: boolean;
}

function Card({
  children,
  elevation = 'sm',
  padding = 'md',
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  const elev = elevation === 'none' ? 'sfw-card--flat' : elevation === 'md' ? 'sfw-card--raised' : '';
  const cls = [
    'sfw-card',
    elev,
    padding && padding !== 'none' ? `sfw-card--pad-${padding}` : '',
    interactive ? 'sfw-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export default Card;
