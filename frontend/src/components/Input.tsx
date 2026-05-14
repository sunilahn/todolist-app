import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInputClasses =
  'w-full h-10 px-3 rounded-md border border-neutral-300 text-base text-neutral-700 bg-white ' +
  'placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-normal ease-standard ' +
  'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light ' +
  'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed';

const errorInputClasses =
  'w-full h-10 px-3 rounded-md text-base text-neutral-700 bg-white ' +
  'placeholder:text-neutral-500 transition-[border-color,box-shadow] duration-normal ease-standard ' +
  'focus:outline-none border-2 border-danger focus:ring-2 focus:ring-danger-light ' +
  'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...rest }, ref) => {
    const inputId = id ?? (label ? `input-${label}` : undefined);

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-base text-neutral-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={`${error ? errorInputClasses : baseInputClasses} ${className}`}
          {...rest}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
