import React from 'react';

export function PremiumLoader({ 
  size = 24, 
  color = '#1e63ff', 
  className = '' 
}: { 
  size?: number; 
  color?: string; 
  className?: string 
}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <div 
        className="absolute w-full h-full rounded-full border-2 border-transparent animate-spin"
        style={{ 
          borderTopColor: color, 
          borderBottomColor: color, 
          animationDuration: '1.2s' 
        }} 
      />
      <div 
        className="absolute w-[70%] h-[70%] rounded-full border border-transparent animate-spin"
        style={{ 
          borderLeftColor: color, 
          borderRightColor: color, 
          animationDirection: 'reverse', 
          animationDuration: '0.8s' 
        }} 
      />
    </div>
  );
}
