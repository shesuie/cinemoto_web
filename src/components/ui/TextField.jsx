import { forwardRef } from 'react';

const TextField = forwardRef(function TextField({ id, label, error, className = '', ...props }, ref) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-white/80">
                {label}
            </label>
            <input
                id={id}
                ref={ref}
                {...props}
                className={`cinema-field mt-1.5 ${error ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/30' : ''} ${className}`}
            />
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        </div>
    );
});

export default TextField;
