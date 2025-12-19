import React from 'react';
import clsx from 'clsx';

const FootballFieldIcon = ({ className }) => {
    return (
        <div className={clsx("relative bg-neon-green/5 rounded-lg border-2 border-neon-green shadow-[0_0_30px_rgba(34,197,94,0.2)] flex flex-col justify-between items-center overflow-hidden", className)}>
            {/* Midfield Line */}
            <div className="absolute top-1/2 w-full h-0.5 bg-neon-green/50 -translate-y-1/2"></div>

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[20%] rounded-full border-2 border-neon-green bg-slate-900/50 flex items-center justify-center">
                <div className="w-[15%] h-[15%] bg-neon-green rounded-full"></div>
            </div>

            {/* Top Area */}
            <div className="w-[60%] h-[20%] border-b-2 border-x-2 border-neon-green rounded-b-sm bg-slate-900/20 relative flex justify-center">
                <div className="w-[50%] h-[30%] border-b-2 border-x-2 border-neon-green/50 rounded-b-xs"></div>
            </div>

            {/* Bottom Area */}
            <div className="w-[60%] h-[20%] border-t-2 border-x-2 border-neon-green rounded-t-sm bg-slate-900/20 relative flex justify-center items-end">
                <div className="w-[50%] h-[30%] border-t-2 border-x-2 border-neon-green/50 rounded-t-xs"></div>
            </div>
        </div>
    );
};

export default FootballFieldIcon;
