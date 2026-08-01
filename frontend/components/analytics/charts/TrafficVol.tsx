import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { ChartDurationPicker } from '../ChartDurationPicker';
import { ANALYTICS_CHART_IDS, useChartDurations } from '../useChartDurations';
import type { AnalyticsWay } from '@/map/squareLocations';
import { getAnalyticsWays } from '@/map/squareLocations';
import type { SquareLocation } from '@/map/squareLocations';
import {
  buildAnalyticsTrafficData,
  type TrafficTimeRow,
} from '@/lib/analyticsTrafficData';

interface MetricConfig {
  key: string;
  label: string;
  color: string;
}

function buildMetrics(activeWays: AnalyticsWay[]): MetricConfig[] {
  return [
    { key: 'overall', label: 'Overall Traffic', color: '#fc8181' },
    ...activeWays.map((way) => ({
      key: way.id,
      label: way.label,
      color: way.color,
    })),
  ];
}

type ChartView = 'overall' | 'directional' | 'custom';

interface TrafficVolProps {
  /** @deprecated use square */
  wayLabels?: never;
  square?: SquareLocation | null;
  activeWays?: AnalyticsWay[];
  trafficTimeSeries?: TrafficTimeRow[];
  durationPickerDisabled?: boolean;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string> & { payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a202c] border border-[#2d3748] rounded shadow-lg p-3 min-w-[120px]">
        <p className="text-gray-100 font-medium mb-2 text-sm">{label}</p>
        {payload.map((entry: { name?: string; value?: number; color?: string }, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium m-0">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrafficVol({
  square = null,
  activeWays: activeWaysProp,
  trafficTimeSeries,
  durationPickerDisabled = false,
}: TrafficVolProps) {
  const activeWays = useMemo(
    () => activeWaysProp ?? getAnalyticsWays(square),
    [activeWaysProp, square],
  );

  const METRICS = useMemo(() => buildMetrics(activeWays), [activeWays]);
  const chartData = useMemo(
    () => trafficTimeSeries ?? buildAnalyticsTrafficData(activeWays).timeSeries,
    [trafficTimeSeries, activeWays],
  );

  const exportCSV = () => {
    const wayHeaders = activeWays.map((w) => w.label);
    const headers = ['Time', 'Overall', ...wayHeaders];
    const csvRows = [
      headers.join(','),
      ...chartData.map((row) =>
        [row.time, row.overall, ...activeWays.map((w) => row[w.id])].join(','),
      ),
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `traffic_data_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const {
    getDuration,
    handleDurationSelect,
  } = useChartDurations();

  useEffect(() => {
    handleDurationSelect(('headlineData' as any), 'Today');
  }, [handleDurationSelect]);

  const [activeView, setActiveView] = useState<ChartView>('overall');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const firstWayKey = activeWays[0]?.id ?? 'R1';
  const [activeCustomMetrics, setActiveCustomMetrics] = useState<Set<string>>(
    new Set(['overall', firstWayKey]),
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveCustomMetrics(new Set(['overall', activeWays[0]?.id ?? 'R1']));
  }, [activeWays]);

  const saveAsImage = () => {
    const svgElement = containerRef.current?.querySelector('.recharts-surface') as SVGSVGElement;
    if (!svgElement) {
      console.error('Could not find chart to export.');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgSize = svgElement.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#131314';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `traffic_chart_${new Date().getTime()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const toggleCustomMetric = (metricKey: string) => {
    setActiveCustomMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricKey)) {
        if (next.size > 1) next.delete(metricKey);
      } else {
        next.add(metricKey);
      }
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const visibleMetrics = useMemo(() => {
    if (activeView === 'overall') return METRICS.filter((m) => m.key === 'overall');
    if (activeView === 'directional') return METRICS.filter((m) => m.key !== 'overall');
    return METRICS.filter((m) => activeCustomMetrics.has(m.key));
  }, [activeView, activeCustomMetrics, METRICS]);

  const ChartThumbnail = ({
    view,
    title,
    lines,
  }: {
    view: ChartView;
    title: string;
    lines: MetricConfig[];
  }) => {
    const isActive = activeView === view;
    return (
      <div
        onClick={() => setActiveView(view)}
        className={`cursor-pointer border transition-all duration-200 rounded-lg p-2 h-32 w-full flex flex-col ${
          isActive ? 'border-[#63b3ed] bg-[#1a202c]' : 'border-[#2d3748] hover:border-[#4a5568] bg-[#131314]'
        }`}
      >
        <span className={`text-xs font-medium mb-1 ${isActive ? 'text-[#63b3ed]' : 'text-gray-400'}`}>
          {title}
        </span>
        <div className="flex-1 w-full pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {lines.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={1}
                  dot={false}
                  animationDuration={0}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`flex font-sans bg-[#131314] text-gray-200 relative z-30 isolate ${
        isFullscreen ? 'h-screen w-screen p-6' : 'h-100 w-full border-r border-[#3c4043] overflow-hidden shadow-2xl'
      }`}
    >
      <div className="w-1/5 min-w-[200px] border-r border-[#3c4043] p-4 flex flex-col gap-4 overflow-y-auto bg-[#131314] z-10">
        <ChartThumbnail
          view="overall"
          title="Overall Traffic"
          lines={METRICS.filter((m) => m.key === 'overall')}
        />
        <ChartThumbnail
          view="directional"
          title="Directional Traffic"
          lines={METRICS.filter((m) => m.key !== 'overall')}
        />
        <ChartThumbnail
          view="custom"
          title="Custom Chart"
          lines={METRICS.filter((m) => activeCustomMetrics.has(m.key))}
        />
      </div>

      <div className="flex-1 flex flex-col pl-1 pr-4 pt-3 pb-2.5 bg-[#131314] relative overflow-visible">
        <div className="relative z-40 flex justify-between items-center mb-5 overflow-visible">
          <h2 className="text-lg font-medium text-gray-200 ml-5 tracking-wide">
            {activeView === 'overall' && 'Overall Traffic Volume'}
            {activeView === 'directional' && 'Directional Traffic Volume'}
            {activeView === 'custom' && 'Custom Traffic Analysis'}
          </h2>

          <div className="relative z-40 flex items-center gap-4 text-gray-400 overflow-visible">
            <ChartDurationPicker
              selectedDuration={getDuration(ANALYTICS_CHART_IDS.overallTraffic)}
              onSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.overallTraffic, d)}
              disabled={durationPickerDisabled}
            />

            <button
              onClick={exportCSV}
              className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
              title="Download CSV Data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            <button
              onClick={saveAsImage}
              className="flex items-center text-gray-400 hover:text-[#AECBFA] transition-colors"
              title="Save as PNG"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-[#AECBFA] transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M16 10h6m0 0v-6m0 6l3-3M4 10h6m0 0V4m0 6L3 3" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#2d3748" strokeWidth={1} />
              <XAxis
                dataKey="time"
                stroke="#718096"
                tick={{ fill: '#718096', fontSize: 12 }}
                tickMargin={12}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                stroke="#718096"
                tick={{ fill: '#718096', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickMargin={12}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a0aec0', strokeWidth: 1 }} />

              {visibleMetrics.map((metric) => (
                <Line
                  key={metric.key}
                  type="monotone"
                  name={metric.label}
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: metric.color,
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {METRICS.filter((metric) => {
            if (activeView === 'overall') return metric.key === 'overall';
            if (activeView === 'directional') return metric.key !== 'overall';
            return true;
          }).map((metric) => {
            const isCustomMode = activeView === 'custom';
            const isActive = isCustomMode ? activeCustomMetrics.has(metric.key) : true;

            return (
              <button
                key={metric.key}
                onClick={() => isCustomMode && toggleCustomMetric(metric.key)}
                disabled={!isCustomMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isCustomMode && (isActive
                  ? 'bg-[#1a202c] text-gray-100 border border-[#4a5568]'
                  : 'bg-transparent text-gray-600 border border-transparent opacity-60'
                )}
                ${isCustomMode ? 'cursor-pointer hover:text-gray-100' : 'cursor-default'}`}
              >
                <span
                  className="w-4.5 h-1.5 rounded"
                  style={{ backgroundColor: isActive ? metric.color : '#4a5568' }}
                />
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
