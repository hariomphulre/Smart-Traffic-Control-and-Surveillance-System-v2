'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toPng } from 'html-to-image';
import { ChartDurationPicker } from './ChartDurationPicker';

interface ChartActionButtonsProps {
  isFullscreen: boolean;
  selectedDuration: string;
  onDurationSelect: (duration: string) => void;
  onExportCsv: () => void;
  onSaveImage: () => void;
  onToggleFullscreen: () => void;
}

function ChartActionButtons({
  isFullscreen,
  selectedDuration,
  onDurationSelect,
  onExportCsv,
  onSaveImage,
  onToggleFullscreen,
}: ChartActionButtonsProps) {
  return (
    <div className="relative z-40 chart-actions flex items-center gap-3.5 text-xs overflow-visible">
      <ChartDurationPicker
        selectedDuration={selectedDuration}
        onSelect={onDurationSelect}
      />
      <button
        onClick={onExportCsv}
        className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
        title="Download CSV Data"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>
      <button
        onClick={onSaveImage}
        className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
        title="Save as PNG"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        onClick={onToggleFullscreen}
        className="text-gray-400 hover:text-[#AECBFA] transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
          </svg>
        )}
      </button>
    </div>
  );
}

interface AnalyticsPieChartPanelProps<T extends { count: number }> {
  title: string;
  data: T[];
  colors: string[];
  nameKey?: keyof T & string;
  dataKey?: keyof T & string;
  label?: (props: { name?: string; percent?: number }) => string;
  tooltipFormatter?: (value: number, name: string, item: { payload?: T }) => [string, string];
  footer: React.ReactNode;
  className?: string;
  csvHeaders: [string, string];
  exportBaseName: string;
  getCellColor?: (entry: T, index: number) => string;
  selectedDuration: string;
  onDurationSelect: (duration: string) => void;
}

export default function AnalyticsPieChartPanel<T extends { count: number }>({
  title,
  data,
  colors,
  nameKey = 'name' as keyof T & string,
  dataKey = 'count' as keyof T & string,
  label,
  tooltipFormatter,
  footer,
  className = 'w-full min-w-0 border-t border-r border-[#3c4043] !bg-[#131314] py-5 relative overflow-visible',
  csvHeaders,
  exportBaseName,
  getCellColor,
  selectedDuration,
  onDurationSelect,
}: AnalyticsPieChartPanelProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const exportCSV = () => {
    const [labelHeader, valueHeader] = csvHeaders;
    const csvContent = [
      [labelHeader, valueHeader].join(','),
      ...data.map((row) => [row[nameKey as keyof T], row[dataKey as keyof T]].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportBaseName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveAsImage = async () => {
    if (!containerRef.current) return;

    try {
      const actionsArea = containerRef.current.querySelector('.chart-actions');
      if (actionsArea) actionsArea.classList.add('invisible');

      const dataUrl = await toPng(containerRef.current, { cacheBust: true, pixelRatio: 2 });

      if (actionsArea) actionsArea.classList.remove('invisible');

      const link = document.createElement('a');
      link.download = `${exportBaseName}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to generate pie chart snapshot:', error);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const defaultLabel = ({ name, percent }: { name?: string; percent?: number }) =>
    `${name}: ${((percent || 0) * 100).toFixed(0)}%`;

  return (
    <div
      ref={containerRef}
      className={`${className} ${isFullscreen ? 'p-10 h-screen flex flex-col justify-center bg-[#131314]' : ''}`}
    >
      <div className="flex justify-between items-center mb-4 pl-6 pr-6">
        <h2 className="text-gray-200 text-lg">{title}</h2>
        <ChartActionButtons
          isFullscreen={isFullscreen}
          selectedDuration={selectedDuration}
          onDurationSelect={onDurationSelect}
          onExportCsv={exportCSV}
          onSaveImage={saveAsImage}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
      <div className={`flex-cols gap-4 ${isFullscreen ? 'flex-1' : ''}`}>
        <ResponsiveContainer width="100%" height={isFullscreen ? '100%' : 300}>
          <PieChart>
            <Pie
              data={data}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={label ?? defaultLabel}
              outerRadius={isFullscreen ? 180 : 100}
              fill="#1a73e8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${String(entry[nameKey as keyof T])}-${index}`}
                  fill={getCellColor ? getCellColor(entry, index) : colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                backgroundColor: 'black',
                color: 'white',
                padding: '0px',
                paddingLeft: '8px',
                paddingRight: '8px',
                borderRadius: '4px',
                border: '0px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full pl-4 flex justify-center">{footer}</div>
      </div>
    </div>
  );
}
