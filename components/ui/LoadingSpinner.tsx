import React from 'react';
import { Theme } from '../../types';

interface LoadingSpinnerProps {
  theme?: Theme;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ theme }) => {
  const colorClass = theme?.id === 'cyber' ? 'bg-red-500' : theme?.id === 'golden' ? 'bg-amber-500' : 'bg-lux-accent';
  
  return (
    <div className="flex items-center justify-center space-x-1 p-2">
      <div className={`w-1.5 h-1.5 ${colorClass} rounded-full animate-pulse`}></div>
      <div className={`w-1.5 h-1.5 ${colorClass}/60 rounded-full animate-pulse [animation-delay:0.2s]`}></div>
      <div className={`w-1.5 h-1.5 ${colorClass}/30 rounded-full animate-pulse [animation-delay:0.4s]`}></div>
    </div>
  );
};

export const ImageGeneratingLoader: React.FC<LoadingSpinnerProps> = ({ theme }) => {
  const borderColor = theme?.id === 'cyber' ? 'border-red-500' : theme?.id === 'golden' ? 'border-amber-500' : 'border-lux-accent';

  return (
    <div className="relative w-12 h-12">
       <div className={`absolute inset-0 border-2 opacity-20 rounded-full ${borderColor}`}></div>
       <div className={`absolute inset-0 border-2 border-t-transparent rounded-full animate-spin ${borderColor}`}></div>
    </div>
  );
};
