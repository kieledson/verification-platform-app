import * as React from 'react';

export type LogoVariant = 'color' | 'white' | 'white-lightblue' | 'mark-color' | 'mark-white';

export interface LogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'height'> {
  variant?: LogoVariant;
  height?: number | string;
  /** Relative path to the /assets/logos directory from the page. */
  assetBase?: string;
}

const FILES: Record<LogoVariant, string> = {
  color: 'sfw-logo-color.png',
  white: 'sfw-logo-white.png',
  'white-lightblue': 'sfw-logo-white-lightblue.png',
  'mark-color': 'sfw-mark-color.png',
  'mark-white': 'sfw-mark-white.png',
};

/**
 * Renders the Monterey Bay Aquarium · Seafood Watch logo.
 * Set `assetBase` to the relative path of /assets/logos from the page.
 */
function Logo({
  variant = 'color',
  height = 44,
  assetBase = 'assets/logos',
  alt = 'Monterey Bay Aquarium Seafood Watch',
  className = '',
  style = {},
  src,
  ...rest
}: LogoProps) {
  const file = FILES[variant] || FILES.color;
  const url = src || `${assetBase.replace(/\/$/, '')}/${file}`;
  return (
    <img
      src={url}
      alt={alt}
      className={['sfw-logo', className].filter(Boolean).join(' ')}
      style={{
        height,
        width: 'auto',
        display: 'block',
        ...style,
      }}
      {...rest}
    />
  );
}

export default Logo;
