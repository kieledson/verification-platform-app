import * as React from 'react';
import './Avatar.css';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  size?: number;
  ring?: boolean;
  color?: string;
}

const PALETTE = ['#005E9B', '#01A58D', '#6B722E', '#634F1D', '#D86023', '#BD2323', '#6A1A5B'];

function initials(name = ''): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

function pick(name = ''): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function Avatar({ name = '', src, size = 36, ring = false, color, className = '', style = {}, ...rest }: AvatarProps) {
  const cls = ['sfw-avatar', ring ? 'sfw-avatar--ring' : '', className].filter(Boolean).join(' ');
  return (
    <span
      className={cls}
      title={name || undefined}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: src ? 'transparent' : color || pick(name),
        ...style,
      }}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}

export default Avatar;
