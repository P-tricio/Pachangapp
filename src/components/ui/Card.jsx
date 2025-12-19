import React from 'react';
import clsx from 'clsx';

const Card = ({ children, className }) => {
    return (
        <div className={clsx("bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50", className)}>
            {children}
        </div>
    );
};

export default Card;
