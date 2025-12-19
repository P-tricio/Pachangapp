import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, onClick, variant = 'primary', className, ...props }) => {
    const baseStyles = 'w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center';

    const variants = {
        primary: 'bg-neon-green text-slate-900 shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:bg-[#32e012]',
        secondary: 'bg-slate-700 text-white hover:bg-slate-600',
        danger: 'bg-neon-red text-white shadow-[0_0_15px_rgba(255,7,58,0.4)] hover:bg-[#ff1e4b]',
        outline: 'border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className={twMerge(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
