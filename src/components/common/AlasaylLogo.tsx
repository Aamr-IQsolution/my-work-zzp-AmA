
import React from 'react';

export const AlasaylLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`relative flex-shrink-0 rounded-full bg-white shadow-2xl overflow-hidden border border-slate-200 flex items-center justify-center ${className}`}>
    <img 
      src="https://alsail-transport.com/wp-content/uploads/2023/11/Alasayel-Logo-New-PNG.png" 
      alt="Alasayl Transport Logo" 
      className="w-full h-full object-cover"
      onError={(e) => {
        // Fallback to a generated avatar if the image fails to load
        (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Alasayl&background=4338ca&color=fff";
      }}
    />
  </div>
);
