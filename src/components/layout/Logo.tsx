"use client";

import React from "react";

export function Logo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 dark:shadow-[inset_0_1px_rgba(255,255,255,0.1)] group hover:scale-105 transition-transform duration-200">
      <svg 
        viewBox="0 0 40 40" 
        className="w-7 h-7 text-white drop-shadow-sm" 
        fill="currentColor"
      >
        {/* Letter A (Simplified/Stylized) */}
        <path d="M14.5 12L8 28H11.5L13 24H19L20.5 28H24L17.5 12H14.5ZM14.5 20.5L16 16.5L17.5 20.5H14.5Z" />
        
        {/* Lightning Bolt (The "Boost") */}
        <path 
          d="M23 10L17 22H22L20 30L26 18H21L23 10Z" 
          fill="#FACC15" 
          className="drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
        />
        
        {/* Letter B (Simplified/Stylized) */}
        <path d="M26 12H31C33.5 12 35 13.5 35 15.5C35 17 34 18 32.5 18.5C34.5 19 36 20.5 36 22.5C36 25.5 34 28 31 28H26V12ZM29.5 18H30.5C31.5 18 32 17.5 32 16.5C32 15.5 31.5 15 30.5 15H29.5V18ZM29.5 25H31C32 25 33 24.5 33 23C33 21.5 32 21 31 21H29.5V25Z" />
      </svg>
    </div>
  );
}
