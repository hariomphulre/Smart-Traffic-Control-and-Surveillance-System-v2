'use client'

import {
  canUseGlobalScope,
  getAvailableOptions,
  globalScopeLabel,
} from '@/lib/iamLocation'
import { MAP_SIGNALS } from '@/map/MapData'
import dynamic from 'next/dynamic'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FiGlobe, FiMapPin } from 'react-icons/fi'

const DynamicMap = dynamic(() => import('@/components/RealMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono text-sm animate-pulse">
      Loading map...
    </div>
  ),
})

type IdentityLocationPickerProps = {
  lockedBase: string[]
  path: string[]
  onPathChange: (path: string[]) => void
  useGlobal: boolean
  onUseGlobalChange: (value: boolean) => void
}

export default function IdentityLocationPicker({
  lockedBase,
  path,
  onPathChange,
  useGlobal,
  onUseGlobalChange,
}: IdentityLocationPickerProps) {
  const [currentInput, setCurrentInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const isPathLocked = path.length >= 4 || useGlobal
  const lockedCount = lockedBase.length
  const showGlobal = canUseGlobalScope(lockedBase)

  const scopedSignals = useMemo(() => {
    if (lockedBase.length === 0) return MAP_SIGNALS
    return MAP_SIGNALS.filter((signal) =>
      lockedBase.every((seg, idx) => signal.path[idx] === seg)
    )
  }, [lockedBase.join('/')])

  useEffect(() => {
    if (useGlobal) {
      setSuggestions([])
      return
    }
    const options = getAvailableOptions(path)
    if (currentInput.trim() === '') {
      setSuggestions(options)
    } else {
      setSuggestions(
        options
          .filter((opt) => opt.toLowerCase().includes(currentInput.toLowerCase()))
          .slice(0, 8)
      )
    }
  }, [currentInput, path, useGlobal])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pushSegment = (segment: string) => {
    if (useGlobal || path.length >= 4) return
    onPathChange([...path, segment])
    setCurrentInput('')
    setShowSuggestions(true)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const clearExtra = () => {
    onPathChange([...lockedBase])
    setCurrentInput('')
    onUseGlobalChange(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useGlobal || path.length >= 4) return

    if ((e.key === '/' || e.key === 'Enter') && currentInput.trim()) {
      e.preventDefault()
      const options = getAvailableOptions(path)
      const exactMatch = options.find(
        (opt) => opt.toLowerCase() === currentInput.toLowerCase().trim()
      )
      if (exactMatch) pushSegment(exactMatch)
    }

    if (e.key === 'Backspace' && currentInput === '' && path.length > lockedCount) {
      e.preventDefault()
      const next = [...path]
      const popped = next.pop()
      onPathChange(next)
      setCurrentInput(popped || '')
      setShowSuggestions(true)
    }
  }

  const handleMapPinClick = (signalPath: string[]) => {
    const withinLock = lockedBase.every((seg, idx) => signalPath[idx] === seg)
    if (!withinLock) return
    onUseGlobalChange(false)
    onPathChange(signalPath)
    setCurrentInput('')
    setIsMapOpen(false)
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="relative z-10 flex w-full border border-[#3c4043] rounded-md h-9 bg-[#0f0f10] items-center justify-between overflow-hidden">
        <div
          onClick={() => {
            if (!isPathLocked) inputRef.current?.focus()
          }}
          className="flex items-center flex-1 h-full outline-none select-none cursor-text min-w-0"
        >
          <p className="ml-3 text-[#9aa0a6] whitespace-nowrap text-xs">Location:</p>
          <div className="flex items-center ml-2 relative w-full h-full min-w-0 overflow-x-auto">
            {path.map((seg, idx) => {
              const isLockedSeg = idx < lockedCount
              return (
                <div key={`${seg}-${idx}`} className="flex items-center shrink-0">
                  <span
                    className={`whitespace-nowrap text-xs ${
                      isLockedSeg ? 'text-[#8AB4F8]' : 'text-[#AECBFA]'
                    }`}
                    title={isLockedSeg ? 'Locked to current IAM path' : undefined}
                  >
                    {seg}
                  </span>
                  <span className="text-[#5f6368] mx-1 font-light text-xs">/</span>
                </div>
              )
            })}

            <div className="relative flex-1 flex items-center h-full min-w-[80px]">
              <input
                ref={inputRef}
                value={currentInput}
                readOnly={isPathLocked}
                onChange={(e) => {
                  if (!isPathLocked) {
                    setCurrentInput(e.target.value)
                    setShowSuggestions(true)
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (!isPathLocked) setShowSuggestions(true)
                }}
                placeholder={
                  useGlobal
                    ? 'Global scope selected'
                    : path.length === 0
                      ? 'state / city / area / signal'
                      : path.length >= 4
                        ? ''
                        : 'continue path…'
                }
                className={`bg-transparent outline-none h-full w-full caret-white cursor-text text-xs
                  ${isPathLocked
                    ? 'text-transparent placeholder:text-[#5f6368]'
                    : 'text-[#9aa0a6] placeholder:text-[#5f6368]'
                  }`}
              />

              {showSuggestions && suggestions.length > 0 && !isPathLocked && (
                <div className="absolute top-full text-sm mt-0 left-0 w-max min-w-[200px] bg-[#202124] border border-[#3c4043] rounded-sm shadow-2xl z-[50] py-0 overflow-hidden">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        pushSegment(s)
                      }}
                      className="px-4 py-1 text-[#9aa0a6] hover:bg-[#3c4043] hover:text-[#8AB4F8] cursor-pointer transition-colors whitespace-nowrap"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center h-full shrink-0">
          <button
            type="button"
            onClick={clearExtra}
            disabled={path.length <= lockedCount && !useGlobal && currentInput === ''}
            className={`px-3 h-full text-xs font-medium transition-all border-l border-[#3c4043] flex items-center gap-1.5
              ${path.length <= lockedCount && !useGlobal && currentInput === ''
                ? 'text-[#e8eaed61] cursor-not-allowed'
                : 'text-[#8AB4F8] hover:bg-[#202124] hover:text-[#AECBFA]'
              }`}
            title="Clear path below locked IAM location"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="px-3 h-full text-xs font-medium transition-all text-[#8AB4F8] hover:bg-[#202124] hover:text-[#AECBFA] border-l border-[#3c4043] flex items-center gap-1.5"
          >
            <FiMapPin className="w-3.5 h-3.5" />
            Map view
          </button>
        </div>
      </div>

      {showGlobal && (
        <button
          type="button"
          onClick={() => {
            const next = !useGlobal
            onUseGlobalChange(next)
            if (next) {
              onPathChange([...lockedBase])
              setCurrentInput('')
              setShowSuggestions(false)
            }
          }}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
            useGlobal
              ? 'border-[#8AB4F8] bg-[#8AB4F8]/15 text-[#8AB4F8]'
              : 'border-[#3c4043] text-[#9aa0a6] hover:border-[#8AB4F8]/50 hover:text-[#e8eaed]'
          }`}
        >
          <FiGlobe className="h-4 w-4" />
          {globalScopeLabel(lockedBase)}
        </button>
      )}

      {isMapOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131314] w-[95vw] h-[85vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
            <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
              <h2 className="text-[#8AB4F8] font-mono text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Select square within current IAM path
              </h2>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="text-[#9aa0a6] hover:text-white transition-colors font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 relative z-0">
              <DynamicMap
                signals={scopedSignals}
                pathSegments={path}
                onPinClick={handleMapPinClick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
