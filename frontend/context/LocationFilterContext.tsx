'use client'

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { LOCATION_DB } from '@/map/MapData2';

export type LocationFilterContextType = {
  pathSegments: string[];
  currentInput: string;
  suggestions: string[];
  showSuggestions: boolean;
  isMapOpen: boolean;
  isLocked: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;
  setPathSegments: (segments: string[]) => void;
  setCurrentInput: (input: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setShowSuggestions: (show: boolean) => void;
  setIsMapOpen: (open: boolean) => void;
  getAvailableOptions: (path: string[]) => string[];
  pushSegment: (segment: string) => void;
  popSegment: () => void;
  handleMapPinClick: (signalPath: string[]) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const LocationFilterContext = createContext<LocationFilterContextType | undefined>(undefined);

export function LocationFilterProvider({ children }: { children: ReactNode }) {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isLocked = pathSegments.length >= 4;

  const getAvailableOptions = (path: string[]) => {
    let currentLevel = LOCATION_DB;
    for (const segment of path) {
      if (!currentLevel[segment]) return [];
      currentLevel = currentLevel[segment];
    }
    return Array.isArray(currentLevel) ? currentLevel : Object.keys(currentLevel);
  };

  useEffect(() => {
    const options = getAvailableOptions(pathSegments);
    if (currentInput.trim() === "") {
      setSuggestions(options);
    } else {
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(currentInput.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8)); // limit to 8 suggestions
    }
  }, [currentInput, pathSegments]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pushSegment = (segment: string) => {
    setPathSegments([...pathSegments, segment]);
    setCurrentInput("");
    setShowSuggestions(true);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const popSegment = () => {
    if (pathSegments.length > 0) {
      const newSegments = [...pathSegments];
      const popped = newSegments.pop();
      setPathSegments(newSegments);
      setCurrentInput(popped || "");
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleMapPinClick = (signalPath: string[]) => {
    setPathSegments(signalPath);
    setCurrentInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === '/' || e.key === 'Enter') && !isLocked) {
      e.preventDefault();
      const options = getAvailableOptions(pathSegments);
      const exactMatch = options.find(opt => opt.toLowerCase() === currentInput.toLowerCase().trim());
      if (exactMatch) {
        pushSegment(exactMatch);
      }
    }
    
    if (e.key === 'Backspace' && currentInput === "" && pathSegments.length > 0) {
      e.preventDefault();
      popSegment();
    }
  };

  return (
    <LocationFilterContext.Provider
      value={{
        pathSegments,
        currentInput,
        suggestions,
        showSuggestions,
        isMapOpen,
        isLocked,
        inputRef,
        wrapperRef,
        setPathSegments,
        setCurrentInput,
        setSuggestions,
        setShowSuggestions,
        setIsMapOpen,
        getAvailableOptions,
        pushSegment,
        popSegment,
        handleMapPinClick,
        handleKeyDown,
      }}
    >
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter() {
  const context = useContext(LocationFilterContext);
  if (context === undefined) {
    throw new Error('useLocationFilter must be used within LocationFilterProvider');
  }
  return context;
}
