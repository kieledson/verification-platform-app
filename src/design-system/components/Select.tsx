import * as React from 'react';
import './Select.css';

export interface SelectOptionObject {
  value: string;
  label: React.ReactNode;
}

export type SelectOption = string | SelectOptionObject;

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  /** Array of strings or {value,label} objects. Ignored if `children` is given. */
  options?: SelectOption[];
}

function Select({ label, options = [], id, className = '', children, ...rest }: SelectProps) {
  const fid = id || (label ? 'sel-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="sfw-sel-field">
      {label && (
        <label className="sfw-sel-label" htmlFor={fid}>
          {label}
        </label>
      )}
      <span className="sfw-sel-wrap">
        <select id={fid} className={['sfw-sel', className].filter(Boolean).join(' ')} {...rest}>
          {children ||
            options.map((o) => {
              const val = typeof o === 'string' ? o : o.value;
              const lbl = typeof o === 'string' ? o : o.label;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
        </select>
        <span className="sfw-sel-caret" />
      </span>
    </div>
  );
}

export default Select;
