import * as React from 'react';
import './Checkbox.css';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

function Checkbox({ label, id, className = '', ...rest }: CheckboxProps) {
  const fid = id || (label ? 'cb-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <label className={['sfw-check', className].filter(Boolean).join(' ')} htmlFor={fid}>
      <input type="checkbox" id={fid} {...rest} />
      <span className="sfw-check__box" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

export default Checkbox;
