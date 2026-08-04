import * as React from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  seamless?: boolean;
}

function Textarea({ label, seamless = false, id, className = '', ...rest }: TextareaProps) {
  const fid = id || (label ? 'ta-' + String(label).replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="sfw-ta-field">
      {label && (
        <label className="sfw-ta-label" htmlFor={fid}>
          {label}
        </label>
      )}
      <textarea
        id={fid}
        className={['sfw-ta', seamless ? 'sfw-ta--seamless' : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}

export default Textarea;
