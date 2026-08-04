import * as React from 'react';
import './Radio.css';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

function Radio({ label, id, className = '', ...rest }: RadioProps) {
  const fid = id || (label ? 'rd-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <label className={['sfw-radio', className].filter(Boolean).join(' ')} htmlFor={fid}>
      <input type="radio" id={fid} {...rest} />
      <span className="sfw-radio__dot" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

export default Radio;
