import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function AdminSelect({ 
  value, 
  onChange, 
  options = [], 
  className = "", 
  disabled = false, 
  placeholder = "Chọn một tùy chọn" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 w-full text-left bg-white px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none
          ${isOpen ? 'border-primary ring-2 ring-primary/15 shadow-sm' : 'border-gray-200 hover:border-gray-300'}
          ${className}
        `}
      >
        <span className={`block truncate min-w-0 flex-1 ${!selectedOption ? 'text-gray-400' : 'text-[#4d4339]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-[#8a7a67] transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#eadfcd] rounded-xl shadow-[0_12px_40px_-12px_rgba(76,47,22,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
          <ul className="max-h-64 overflow-y-auto py-1.5 scrollbar-hide">
            {options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-[14px] transition-colors
                    ${isSelected ? 'bg-[#fffaf4] text-primary font-bold' : 'text-[#5d5246] hover:bg-[#fffaf4] hover:text-[#4d4339] font-medium'}
                  `}
                >
                  <span className="block truncate">{option.label}</span>
                  {isSelected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-primary">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
