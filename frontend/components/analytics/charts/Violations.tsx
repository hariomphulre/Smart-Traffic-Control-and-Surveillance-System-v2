import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { ChartDurationPicker } from '../ChartDurationPicker';
import { ANALYTICS_CHART_IDS, useChartDurations } from '../useChartDurations';
import type { AnalyticsWay } from '@/map/squareLocations';
import { getAnalyticsWays } from '@/map/squareLocations';
import type { SquareLocation } from '@/map/squareLocations';

type ViolationType = 'speed' | 'helmet' | 'tripling' | 'redLightJump';
type ViolationView = ViolationType | 'overview';
type LayoutMode = 'detailed' | 'grid';

interface ViolationDataRow {
  time: string;
  [key: string]: string | number;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  violationType: ViolationType | 'overview';
}

const VIOLATION_TYPES: ViolationType[] = ['speed', 'helmet', 'tripling', 'redLightJump'];

const VIEW_TITLES: Record<ViolationView, string> = {
  speed: 'Speed Violations',
  helmet: 'Helmet Violations',
  tripling: 'Tripling Violations',
  redLightJump: 'Red Light Violations',
  overview: 'Violation Overview',
};

const OVERVIEW_AVG_COLORS: Record<ViolationType, string> = {
  speed: '#63b3ed',
  helmet: '#68d391',
  tripling: '#f6ad55',
  redLightJump: '#fc8181',
};

const AVG_LINE_COLOR = '#fc8181';

function isAvgMetric(metric: MetricConfig): boolean {
  return metric.label === 'Avg.' || metric.label.endsWith(' Avg.');
}

const TYPE_BASE: Record<ViolationType, number> = {
  speed: 40,
  helmet: 30,
  tripling: 20,
  redLightJump: 25,
};

function seriesKey(type: ViolationType, series: 'avg' | string): string {
  return series === 'avg' ? `${type}_avg` : `${type}_${series}`;
}

function generateViolationData(activeWays: AnalyticsWay[]): ViolationDataRow[] {
  const data: ViolationDataRow[] = [];
  const startTime = new Date();
  startTime.setHours(14, 4, 0, 0);
  const pointCount = 181;

  for (let i = 0; i < pointCount; i += 1) {
    const isSpike = i > 120 && i < 150;
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

    const row: ViolationDataRow = { time: timeStr };

    for (const type of VIOLATION_TYPES) {
      const base = TYPE_BASE[type];
      const spikeMul = type === 'speed' ? 4 : type === 'redLightJump' ? 3.5 : type === 'helmet' ? 3 : 2.5;

      const wayValues = activeWays.map((_, wi) =>
        isSpike
          ? Math.floor(Math.random() * base * spikeMul * (1 - wi * 0.08) + base)
          : Math.floor(Math.random() * 18 + base - wi * 2),
      );

      const avg =
        wayValues.length > 0
          ? Math.round(wayValues.reduce((sum, v) => sum + v, 0) / wayValues.length)
          : isSpike
            ? Math.floor(Math.random() * base * spikeMul + base)
            : Math.floor(Math.random() * 20 + base);

      row[seriesKey(type, 'avg')] = avg;
      activeWays.forEach((way, wi) => {
        row[seriesKey(type, way.id)] = wayValues[wi];
      });
    }

    data.push(row);
    startTime.setSeconds(startTime.getSeconds() + 15);
  }

  return data;
}

function buildMetrics(view: ViolationView, activeWays: AnalyticsWay[]): MetricConfig[] {
  if (view === 'overview') {
    return VIOLATION_TYPES.map((type) => ({
      key: seriesKey(type, 'avg'),
      label: `${VIEW_TITLES[type].replace(' Violations', '')} Avg.`,
      color: OVERVIEW_AVG_COLORS[type],
      violationType: 'overview',
    }));
  }

  return [
    {
      key: seriesKey(view, 'avg'),
      label: 'Avg.',
      color: AVG_LINE_COLOR,
      violationType: view,
    },
    ...activeWays.map((way) => ({
      key: seriesKey(view, way.id),
      label: way.label,
      color: way.color,
      violationType: view,
    })),
  ];
}

const formatYAxis = (tickItem: number) => {
  if (tickItem === 0) return '0';
  return `${Math.round(tickItem)}`;
};

const formatXAxis = (tickItem: string) => tickItem.replace(/:\d{2}\s/, ' ');

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string> & {
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a202c] border border-[#2d3748] rounded shadow-lg p-3 min-w-[120px] z-50">
        <p className="text-gray-100 font-medium mb-2 text-sm">{label}</p>
        {payload.map((entry: { name?: string; value?: number; color?: string }, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm m-0">
            {entry.name}: {formatYAxis(entry.value as number)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ViolationsProps {
  square?: SquareLocation | null;
  activeWays?: AnalyticsWay[];
  durationPickerDisabled?: boolean;
}

export default function Violations({
  square = null,
  activeWays: activeWaysProp,
  durationPickerDisabled = false,
}: ViolationsProps) {
  const activeWays = useMemo(
    () => activeWaysProp ?? getAnalyticsWays(square),
    [activeWaysProp, square],
  );

  const chartData = useMemo(() => generateViolationData(activeWays), [activeWays]);

  const { getDuration, handleDurationSelect } = useChartDurations();

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('detailed');
  const [activeView, setActiveView] = useState<ViolationView>('speed');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => buildMetrics(activeView, activeWays), [activeView, activeWays]);

  const overviewMetrics = useMemo(
    () => buildMetrics('overview', activeWays),
    [activeWays],
  );

  // Added dynamic topLegend setup based on layout mode
  const topLegend = useMemo(() => {
    if (layoutMode === 'detailed') {
      return metrics;
    }
    return [
      { key: 'global_avg', label: 'Avg.', color: AVG_LINE_COLOR },
      ...activeWays.map((way) => ({ key: way.id, label: way.label, color: way.color })),
    ];
  }, [layoutMode, metrics, activeWays]);

  const exportCSV = () => {
    const headers = ['Time'];
    for (const type of VIOLATION_TYPES) {
      headers.push(`${type}_avg`);
      activeWays.forEach((way) => headers.push(`${type}_${way.id}`));
    }

    const csvRows = [
      headers.join(','),
      ...chartData.map((row) =>
        [row.time, ...headers.slice(1).map((h) => row[h] ?? '')].join(','),
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `violations_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveAsImage = () => {
    const svgElement = containerRef.current?.querySelector('.recharts-surface') as SVGSVGElement;
    if (!svgElement) return;

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
      const downloadLink = document.createElement('a');
      downloadLink.download = `violations_chart_${Date.now()}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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

  const ChartThumbnail = ({
    view,
    title,
    lines,
  }: {
    view: ViolationView;
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
                  strokeWidth={isAvgMetric(metric) ? 2 : 1.5}
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

  const GridChartCell = ({
    title,
    metrics,
  }: {
    title: string;
    metrics: MetricConfig[];
  }) => (
    <div className="flex flex-col pt-2 pr-4 pl-2 pb-1 bg-[#131314] border border-[#3c4043] rounded-lg relative transition-colors">
      <h3 className="text-sm pl-2 font-medium text-gray-200 mb-3">{title}</h3>
      <div className="flex-1 w-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#2d3748" strokeWidth={1} />
            <XAxis
              dataKey="time"
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: 11 }}
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: 11 }}
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {metrics.map((metric) => (
              <Line
                key={metric.key}
                type="monotone"
                name={metric.label}
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={isAvgMetric(metric) ? 2 : 1.5}
                dot={false}
                activeDot={{ r: 3, fill: metric.color, stroke: '#131314', strokeWidth: 1.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col font-sans bg-[#131314] text-gray-200 relative z-30 isolate ${
        isFullscreen
          ? 'h-screen w-screen p-2'
          : 'h-140 w-full border-r border-t border-b border-[#3c4043] overflow-hidden shadow-2xl'
      }`}
    >
      {/* GLOBAL TOP BAR */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-[#3c4043] bg-[#131314] shrink-0">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-medium text-gray-100 tracking-wide">
            Violations Data
          </h2>

          {/* VIEW OPTIONS TOGGLE */}
          <div className="flex bg-[#131314] p-0.5 rounded-lg border border-[#3c4043]">
            <button
              onClick={() => setLayoutMode('detailed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                layoutMode === 'detailed'
                  ? 'bg-[#2d3748] text-[#8AB4F8] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-[#2d3748] text-[#63b3ed] shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Grid
            </button>
          </div>

          {/* TOP LEGEND LABELS */}
          {layoutMode==='grid' && 
          
            <div className="flex items-center gap-3 border-l border-[#3c4043] pl-6 ml-2">
              {topLegend.map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-default text-gray-100"
                >
                  <span
                    className="w-4.5 h-1.5 rounded"
                    style={{ backgroundColor: metric.color }}
                  />
                  {metric.label}
                </button>
              ))}
            </div>
          }
        </div>

        {/* GLOBAL CONTROLS */}
        <div className="flex items-center gap-4 text-gray-400">
          <ChartDurationPicker
            selectedDuration={getDuration(ANALYTICS_CHART_IDS.speedLine)}
            onSelect={(d) => handleDurationSelect(ANALYTICS_CHART_IDS.speedLine, d)}
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

      {/* CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {layoutMode === 'detailed' ? (
          <>
            <div className="w-1/5 min-w-[200px] border-r border-[#3c4043] p-4 flex flex-col gap-4 overflow-y-auto bg-[#131314] z-10">
              <ChartThumbnail view="overview" title="Violation Overview" lines={overviewMetrics} />
              <ChartThumbnail view="speed" title="Speed" lines={buildMetrics('speed', activeWays)} />
              <ChartThumbnail view="helmet" title="Helmet" lines={buildMetrics('helmet', activeWays)} />
              <ChartThumbnail view="tripling" title="Tripling" lines={buildMetrics('tripling', activeWays)} />
              <ChartThumbnail view="redLightJump" title="Red Light Jump" lines={buildMetrics('redLightJump', activeWays)} />
            </div>

            <div className="flex-1 flex flex-col pl-5 pr-6 pt-4 pb-4 bg-[#131314] relative overflow-visible">
              <h3 className="text-md font-medium text-gray-200 mb-5 tracking-wide">
                {VIEW_TITLES[activeView]}
              </h3>

              <div className="flex-1 w-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke="#2d3748" strokeWidth={1} />
                    <XAxis
                      dataKey="time"
                      stroke="#718096"
                      tick={{ fill: '#718096', fontSize: 12 }}
                      tickFormatter={formatXAxis}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={60}
                    />
                    <YAxis
                      stroke="#718096"
                      tick={{ fill: '#718096', fontSize: 12 }}
                      tickFormatter={formatYAxis}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {metrics.map((metric) => (
                      <Line
                        key={metric.key}
                        type="monotone"
                        name={metric.label}
                        dataKey={metric.key}
                        stroke={metric.color}
                        strokeWidth={isAvgMetric(metric) ? 2 : 1.5}
                        dot={false}
                        activeDot={{ r: 4, fill: metric.color, stroke: '#131314', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {metrics.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    disabled
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-default text-gray-100"
                  >
                    <span
                      className="w-4.5 h-1.5 rounded"
                      style={{ backgroundColor: metric.color }}
                    />
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-[#131314] overflow-y-auto">
            {VIOLATION_TYPES.map((type) => (
              <GridChartCell
                key={type}
                title={VIEW_TITLES[type]}
                metrics={buildMetrics(type, activeWays)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}