'use client'

import { useLocationFilter } from '@/context/LocationFilterContext';

export default function LocationBar() {
  const {
    pathSegments,
    currentInput,
    suggestions,
    showSuggestions,
    isMapOpen,
    isLocked,
    inputRef,
    wrapperRef,
    setPathSegments, // <-- Added this to clear the path
    setCurrentInput,
    setShowSuggestions,
    setIsMapOpen,
    pushSegment,
    handleKeyDown,
  } = useLocationFilter();

  const handleClear = () => {
    setPathSegments([]);
    setCurrentInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full relative font-sans z-50" ref={wrapperRef}>
      {/* TOP LOCATION BAR */}
      <div className="relative z-50 flex w-full border-b border-[#3c4043] h-8 bg-black mb-0 items-center justify-between">
        
        <div 
          onClick={() => inputRef.current?.focus()}
          className="flex items-center flex-1 h-full outline-none select-none cursor-text" 
        >
          <p className="ml-5 text-[#9aa0a6] whitespace-nowrap">Location:</p>
          
          <div className="flex items-center ml-2 relative w-full h-full">
            
            {pathSegments.map((seg, idx) => (
              <div key={idx} className="flex items-center">
                <span className="text-[#8AB4F8] whitespace-nowrap">{seg}</span>
                <span className="text-[#5f6368] mx-1.5 font-light">/</span>
              </div>
            ))}

            <div className="relative flex-1 flex items-center h-full">
              <input
                ref={inputRef}
                value={currentInput}
                readOnly={isLocked} 
                onChange={(e) => {
                  if (!isLocked) {
                    setCurrentInput(e.target.value);
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (!isLocked) setShowSuggestions(true); }}
                placeholder={pathSegments.length === 0 ? "state / city / area / signal code, Ex: Maharashtra / Mumbai / Bandra / MMB2" : ""}
                className={`bg-transparent outline-none h-full w-full caret-white cursor-text
                  ${isLocked 
                    ? 'text-transparent placeholder:text-transparent' 
                    : 'text-[#9aa0a6] placeholder:text-[#5f6368]'}
                `}
              />

              {showSuggestions && suggestions.length > 0 && !isLocked && (
                <div className="absolute top-full text-sm mt-0 left-0 w-max min-w-[200px] bg-[#202124] border border-[#3c4043] rounded-sm shadow-2xl z-[120] py-0 overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <div 
                      key={idx}
                      onMouseDown={(e) => {
                        e.preventDefault(); 
                        pushSegment(s);
                      }}
                      className="px-4 py-1 text-[#9aa0a6] hover:bg-[#3c4043] hover:text-[#8AB4F8] cursor-pointer transition-colors whitespace-nowrap"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {isLocked && (
              <div className="pr-4 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}

          </div>
        </div>

        {/* Buttons Container */}
        <div className="flex items-center h-full">
          {/* CLEAR BUTTON */}
          <button 
            onClick={handleClear}
            disabled={pathSegments.length === 0 && currentInput === ""}
            className={`px-4 h-full font-medium transition-all border-l border-[#3c4043] flex items-center gap-2
              ${(pathSegments.length === 0 && currentInput === "")
                ? 'text-[#e8eaed61] cursor-not-allowed' 
                : 'text-[#8AB4F8] hover:bg-[#202124] hover:text-[#AECBFA]'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>

          {/* MAP VIEW BUTTON */}
          <button 
            onClick={() => setIsMapOpen(true)}
            className="px-4 h-full font-medium transition-all text-[#8AB4F8] hover:bg-[#202124] hover:text-[#AECBFA] border-l border-[#3c4043] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Map view
          </button>
        </div>

      </div>
    </div>
  );
}