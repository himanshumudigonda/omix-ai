import React, { useState, useEffect, useRef } from 'react';

interface GravityInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder: string;
  theme: any;
}

export const GravityInput: React.FC<GravityInputProps> = ({ 
  value, onChange, onEnter, onFocus, onBlur, placeholder, theme 
}) => {
  const [letters, setLetters] = useState<{ char: string; id: number }[]>([]);
  const prevValueLength = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length > prevValueLength.current) {
      // New character added
      const char = value.slice(-1);
      setLetters(prev => [...prev, { char, id: Date.now() }]);
    } else if (value.length < prevValueLength.current) {
      // Character removed
      setLetters(prev => prev.slice(0, value.length));
    }
    prevValueLength.current = value.length;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full h-full min-h-[40px] flex items-center" ref={containerRef}>
      {/* Invisible Input for logic */}
      <input
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text caret-white"
        autoFocus
      />
      
      {/* Visual Input with Animation */}
      <div className={`flex flex-wrap items-center w-full pointer-events-none ${theme.text}`}>
        {value.length === 0 && (
          <span className="opacity-40 font-arcade text-xs">{placeholder}</span>
        )}
        {letters.map((item, index) => (
          <span 
            key={item.id} 
            className="inline-block animate-letter-drop whitespace-pre font-arcade text-sm"
            style={{ animationDelay: '0ms' }}
          >
            {item.char}
          </span>
        ))}
        {/* Cursor */}
        <span className="w-2 h-4 bg-green-500 animate-pulse ml-1"></span>
      </div>
    </div>
  );
};