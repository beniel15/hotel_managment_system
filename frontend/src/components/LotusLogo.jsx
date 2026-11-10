import React from 'react';
import { Link } from 'react-router-dom';

export const LotusIcon = ({ size = 28, className = 'text-[#7B1123]' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lotus central petal */}
      <path
        d="M32 10 C32 10 24 24 24 38 C24 46 28 50 32 52 C36 50 40 46 40 38 C40 24 32 10 32 10 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left inner petal */}
      <path
        d="M26 24 C26 24 14 30 14 42 C14 49 20 52 26 52 C30 52 32 50 32 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right inner petal */}
      <path
        d="M38 24 C38 24 50 30 50 42 C50 49 44 52 38 52 C34 52 32 50 32 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left outer petal */}
      <path
        d="M17 38 C17 38 7 42 7 48 C7 52 13 54 20 54"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right outer petal */}
      <path
        d="M47 38 C47 38 57 42 57 48 C57 52 51 54 44 54"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base curve */}
      <path
        d="M22 56 C27 58 37 58 42 56"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

const LotusLogo = ({ 
  subtitle = 'Premium Stay Experience', 
  to = '/', 
  dark = false,
  className = '' 
}) => {
  return (
    <Link to={to} className={`flex items-center gap-2.5 group select-none ${className}`}>
      <div className="shrink-0 transition-transform group-hover:scale-105">
        <LotusIcon 
          size={32} 
          className={dark ? 'text-white' : 'text-[#7B1123]'} 
        />
      </div>
      <div className="flex flex-col">
        <span className={`text-[17px] font-bold tracking-tight leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          Hotel Saravana
        </span>
        {subtitle && (
          <span className={`text-[10px] tracking-wide font-medium leading-none mt-0.5 ${dark ? 'text-white/70' : 'text-slate-500'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
};

export default LotusLogo;

