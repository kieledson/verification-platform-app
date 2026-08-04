import * as React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Takes priority over `hint` when both are present. */
  error?: React.ReactNode;
  required?: boolean;
}

function Input({ label, hint, error, required = false, id, className = '', ...rest }: InputProps) {
  const fid = id || (label ? 'inp-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="sfw-field">
      {label && (
        <label className="sfw-field__label" htmlFor={fid}>
          {label}
          {required && <span className="sfw-field__req">*</span>}
        </label>
      )}
      <input
        id={fid}
        className={['sfw-input', error ? 'sfw-input--error' : '', className].filter(Boolean).join(' ')}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? <span className="sfw-field__err">{error}</span> : hint ? <span className="sfw-field__hint">{hint}</span> : null}
    </div>
  );
}

export default Input;
