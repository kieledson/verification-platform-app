import * as React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Lucide icon name, kebab-case (e.g. "arrow-left"). */
  name: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Converts a kebab-case Lucide icon name (e.g. "arrow-left") into the
 * PascalCase named export lucide-react uses (e.g. "ArrowLeft").
 */
function kebabToPascal(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

const iconRegistry = LucideIcons as unknown as Record<
  string,
  React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>
>;

/**
 * Thin wrapper over lucide-react icons, ported from the design-tool bundle's
 * Icon component (which relied on a globally-loaded lucide UMD script and
 * `window.lucide.createIcons()`). Renders the real lucide-react component
 * instead, so no external <script> tag or global is required.
 *
 * If `name` doesn't resolve to a known icon, renders nothing rather than
 * throwing — icon names may come from generated data.
 */
function Icon({ name, size = 20, strokeWidth = 2, className = '', style = {}, ...rest }: IconProps) {
  const Cmp = iconRegistry[kebabToPascal(name)];
  if (!Cmp) return null;
  return (
    <span
      className={['sfw-icon', className].filter(Boolean).join(' ')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    >
      <Cmp width={size} height={size} strokeWidth={strokeWidth} />
    </span>
  );
}

export default Icon;
