"use client";

import React, { useEffect, useReducer, useMemo } from 'react';
import { FaLinux, FaMinusSquare, FaPause, FaPlusSquare } from 'react-icons/fa';
import { GrPause } from 'react-icons/gr';
import { IoPlayOutline } from 'react-icons/io5';
import { RiRefreshLine } from 'react-icons/ri';

// --- Types & Constants ---
type Vehicle = 1 | 2; // 1 = Car, 2 = Ambulance
type LaneQueue = Vehicle[];
type DirectionData = { lane1: LaneQueue; lane2: LaneQueue };
type Queues = Record<1 | 2 | 3 | 4, DirectionData>;
type LightColor = 'RED' | 'YELLOW' | 'GREEN';
type SimMode = 'Dormant' | 'Normal' | 'Ambulance' | 'Preempting';

const YELLOW_DURATION = 3;
const GREEN_UNIT = 2;
const GREEN_MAX = 30;

interface SimState {
  queues: Queues;
  isRunning: boolean;
  mode: SimMode;
  activeDir: 1 | 2 | 3 | 4 | null;
  nextDir: 1 | 2 | 3 | 4 | null;
  laneOrder: (1 | 2 | 3 | 4)[];
  timer: number;
  departureTick: number;
}

type Action = 
  | { type: 'TICK' }
  | { type: 'TOGGLE_RUN' }
  | { type: 'RESET' }
  | { type: 'ADD_VEHICLE'; dir: 1 | 2 | 3 | 4; vType: Vehicle }
  | { type: 'REMOVE_VEHICLE'; dir: 1 | 2 | 3 | 4 };

const INITIAL_QUEUES: Queues = {
  1: { lane1: [1, 1], lane2: [1] },
  2: { lane1: [1], lane2: [1, 2] }, 
  3: { lane1: [1, 1, 1], lane2: [1, 1] }, 
  4: { lane1: [1], lane2: [1] },
};

const INITIAL_STATE: SimState = {
  queues: INITIAL_QUEUES,
  isRunning: false,
  mode: 'Dormant',
  activeDir: null,
  nextDir: null,
  laneOrder: [],
  timer: 0,
  departureTick: 0,
};

// --- Core Formulas ---
const calculateGreenTime = (dirData: DirectionData): number => {
  if (!dirData) return 0; 
  const totalVehicles = dirData.lane1.length + dirData.lane2.length;
  if (totalVehicles === 0) return 0;
  
  const calcTime = (Math.floor(totalVehicles / 2) + (totalVehicles % 2 === 1 ? 1 : 0)) * GREEN_UNIT;
  return Math.max(4, Math.min(calcTime, GREEN_MAX)); 
};

const cloneQueues = (q: Queues): Queues => ({
  1: { lane1: [...q[1].lane1], lane2: [...q[1].lane2] },
  2: { lane1: [...q[2].lane1], lane2: [...q[2].lane2] },
  3: { lane1: [...q[3].lane1], lane2: [...q[3].lane2] },
  4: { lane1: [...q[4].lane1], lane2: [...q[4].lane2] },
});

const getDensityOrder = (queues: Queues): (1|2|3|4)[] => {
  const dirs: (1|2|3|4)[] = [1, 2, 3, 4];
  return dirs
    .filter(d => queues[d].lane1.length + queues[d].lane2.length > 0)
    .sort((a, b) => {
      const countA = queues[a].lane1.length + queues[a].lane2.length;
      const countB = queues[b].lane1.length + queues[b].lane2.length;
      return countB - countA; 
    });
};

// --- State Machine Engine ---
function simReducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'TOGGLE_RUN':
      if (!state.isRunning) {
        const newOrder = getDensityOrder(state.queues);
        if (newOrder.length === 0) {
           return { ...state, isRunning: true, mode: 'Dormant', timer: 0 };
        }
        return { 
          ...state, 
          isRunning: true, 
          mode: 'Normal',
          laneOrder: newOrder,
          activeDir: newOrder[0],
          nextDir: newOrder.length > 1 ? newOrder[1] : null,
          timer: calculateGreenTime(state.queues[newOrder[0]]) 
        };
      }
      return { ...state, isRunning: false };

    case 'RESET':
      return { ...INITIAL_STATE, queues: cloneQueues(INITIAL_QUEUES) };

    case 'ADD_VEHICLE': {
      const nextQ = cloneQueues(state.queues);
      const q = nextQ[action.dir];
      
      if (q.lane1.length <= q.lane2.length) q.lane1.push(action.vType);
      else q.lane2.push(action.vType);

      return { ...state, queues: nextQ };
    }

    case 'REMOVE_VEHICLE': {
      const nextQ = cloneQueues(state.queues);
      const q = nextQ[action.dir];
      if (q.lane1.length === 0 && q.lane2.length === 0) return state;

      if (q.lane1.length >= q.lane2.length) q.lane1.pop();
      else q.lane2.pop();
      
      return { ...state, queues: nextQ };
    }

    case 'TICK': {
      if (!state.isRunning) return state;

      const nextState = { ...state, queues: cloneQueues(state.queues) };
      
      const totalGlobalVehicles = ([1, 2, 3, 4] as const).reduce(
        (sum, dir) => sum + nextState.queues[dir].lane1.length + nextState.queues[dir].lane2.length, 0
      );

      // 1. Ambulance Global Scan
      let minAmbDist = Infinity;
      let ambDir: 1 | 2 | 3 | 4 | null = null;
      ([1, 2, 3, 4] as const).forEach(dir => {
        const i1 = nextState.queues[dir].lane1.indexOf(2);
        const i2 = nextState.queues[dir].lane2.indexOf(2);
        const first = Math.min(i1 !== -1 ? i1 : Infinity, i2 !== -1 ? i2 : Infinity);
        if (first < minAmbDist) {
          minAmbDist = first;
          ambDir = dir;
        }
      });

      // 2. State Overrides
      if (ambDir) {
        if (nextState.mode === 'Normal' && nextState.activeDir !== ambDir) {
          if (nextState.timer > YELLOW_DURATION) {
            nextState.mode = 'Preempting';
            nextState.timer = YELLOW_DURATION;
            nextState.nextDir = ambDir;
          }
        } else if (nextState.mode === 'Dormant') {
          nextState.mode = 'Ambulance';
          nextState.activeDir = ambDir;
          nextState.nextDir = null;
          nextState.timer = 99; 
        } else if (nextState.mode === 'Ambulance' && nextState.activeDir !== ambDir) {
          nextState.mode = 'Preempting';
          nextState.timer = YELLOW_DURATION;
          nextState.nextDir = ambDir;
        }
      } else if (nextState.mode === 'Ambulance') {
         nextState.mode = 'Normal';
         nextState.timer = 0; 
      }

      if (totalGlobalVehicles === 0) {
        nextState.mode = 'Dormant';
        nextState.activeDir = null;
        nextState.nextDir = null;
        nextState.timer = 0;
        return nextState;
      }

      if (nextState.mode === 'Dormant' && totalGlobalVehicles > 0) {
        const newOrder = getDensityOrder(nextState.queues);
        if (newOrder.length > 0) {
          nextState.mode = 'Normal';
          nextState.laneOrder = newOrder;
          nextState.activeDir = newOrder[0];
          nextState.nextDir = newOrder.length > 1 ? newOrder[1] : null;
          nextState.timer = calculateGreenTime(nextState.queues[newOrder[0]]);
        }
        return nextState;
      }

      // 3. Vehicle Departure Logic
      const isActivePhase = (nextState.mode === 'Normal' || nextState.mode === 'Preempting' || nextState.mode === 'Ambulance');
      
      if (isActivePhase && nextState.activeDir !== null) {
        nextState.departureTick += 1;
        if (nextState.departureTick >= 2) {
          const activeQ = nextState.queues[nextState.activeDir];
          if (activeQ.lane1.length > 0) activeQ.lane1.shift(); 
          if (activeQ.lane2.length > 0) activeQ.lane2.shift(); 
          nextState.departureTick = 0;
        }
      }

      // 4. Timer Tick & Phase Transitions
      if ((nextState.mode === 'Normal' || nextState.mode === 'Preempting') && nextState.activeDir !== null) {
        const activeQ = nextState.queues[nextState.activeDir];
        const activeVehicles = activeQ.lane1.length + activeQ.lane2.length;
        
        nextState.timer -= 1;

        if (nextState.timer <= 0) {
          if (nextState.mode === 'Preempting' && ambDir) {
            nextState.mode = 'Ambulance';
            nextState.activeDir = ambDir;
            nextState.nextDir = null;
            nextState.timer = 99;
          } else {
            const newOrder = getDensityOrder(nextState.queues);
            
            if (newOrder.length === 0) {
              nextState.mode = 'Dormant';
              nextState.activeDir = null;
              nextState.nextDir = null;
              nextState.timer = 0;
              nextState.departureTick = 0;
            } else {
              nextState.mode = 'Normal';
              nextState.laneOrder = newOrder;
              nextState.activeDir = newOrder[0];
              nextState.nextDir = newOrder.length > 1 ? newOrder[1] : null;
              nextState.timer = calculateGreenTime(nextState.queues[newOrder[0]]);
              nextState.departureTick = 0;
            }
          }
        } 
        else if (activeVehicles === 0 && nextState.mode === 'Normal' && nextState.timer > YELLOW_DURATION) {
          nextState.timer = YELLOW_DURATION;
        }
      }

      return nextState;
    }
    default:
      return state;
  }
}

export default function TrafficSimulation() {
  const [state, dispatch] = useReducer(simReducer, INITIAL_STATE);

  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Dynamic Density-Driven Countdowns ---
  const countdowns = useMemo(() => {
    const counts: Record<number, number | string> = { 1: '--', 2: '--', 3: '--', 4: '--' };
    
    if (state.mode === 'Dormant') return counts;

    if (state.mode === 'Ambulance' && state.activeDir) {
      counts[state.activeDir] = 'A'; 
      return counts;
    }

    if ((state.mode === 'Normal' || state.mode === 'Preempting') && state.activeDir) {
      counts[state.activeDir] = state.timer;
      if (state.nextDir) {
         counts[state.nextDir] = state.timer;
      }

      if (state.mode === 'Normal' && state.laneOrder.length > 2) {
        for (let i = 2; i < state.laneOrder.length; i++) {
          let waitTime = state.timer;
          for (let j = 1; j < i; j++) {
            waitTime += calculateGreenTime(state.queues[state.laneOrder[j]]);
          }
          counts[state.laneOrder[i]] = waitTime;
        }
      }
    }
    return counts;
  }, [state]);

  // --- Rendering Helpers ---
  const getLightColor = (dir: 1|2|3|4): LightColor => {
    if (state.mode === 'Dormant') return 'RED';
    if (state.mode === 'Ambulance') return dir === state.activeDir ? 'GREEN' : 'RED';
    
    if (state.mode === 'Preempting') {
       if (dir === state.activeDir || dir === state.nextDir) return 'YELLOW';
       return 'RED';
    }

    if (state.mode === 'Normal') {
       if (state.timer > YELLOW_DURATION) {
          return dir === state.activeDir ? 'GREEN' : 'RED';
       } else {
          if (dir === state.activeDir || dir === state.nextDir) return 'YELLOW';
          return 'RED';
       }
    }
    return 'RED';
  };

  const renderVehicle = (v: Vehicle, index: number, isVertical: boolean) => (
    <div key={index} className={`
      ${isVertical ? 'w-6 h-8' : 'w-8 h-6'} 
      rounded flex items-center justify-center text-[10px] font-bold shadow-md
      ${v === 2 ? 'bg-red-600 text-white animate-pulse shadow-[0_0_12px_red]' : 'bg-cyan-500 text-black'}
    `}>
      {v === 2 ? 'A' : 'C'}
    </div>
  );

  const renderLight = (dir: 1|2|3|4, posClasses: string) => {
    const lightState = getLightColor(dir);
    const isG = lightState === 'GREEN';
    const isY = lightState === 'YELLOW';
    const isR = lightState === 'RED';

    // The solid line mounting poles
    const renderPole = () => {
      const base = "absolute bg-zinc-600 border-zinc-900 -z-10 shadow-lg";
      switch(dir) {
        case 1: return <div className={`${base} right-[103%] top-[35%] w-[16px] h-[8px] border-y-2 border-l-2 rounded-l-sm`} />;
        case 2: return <div className={`${base} bottom-[101%] left-1/2 -translate-x-1/2 w-[8px] h-[18px] border-x-2 border-t-2 rounded-t-sm`} />;
        case 3: return <div className={`${base} left-[102%] top-[35%] w-[18px] h-[8px] border-y-2 border-r-2 rounded-r-sm`} />;
        case 4: return <div className={`${base} top-[100%] left-1/2 -translate-x-1/2 w-[8px] h-[18px] border-x-2 border-b-2 rounded-b-sm`} />;
      }
    };

    return (
      <div className={`absolute ${posClasses} z-20 flex flex-col items-center bg-zinc-950 p-2 rounded-xl border-2 border-zinc-700 shadow-2xl`}>
        {renderPole()}
        <div className="flex flex-col gap-2 mb-3 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 shadow-inner">
          <div className={`w-5 h-5 rounded-full transition-colors ${isR ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-zinc-800'}`} />
          <div className={`w-5 h-5 rounded-full transition-colors ${isY ? 'bg-yellow-400 shadow-[0_0_15px_yellow]' : 'bg-zinc-800'}`} />
          <div className={`w-5 h-5 rounded-full transition-colors ${isG ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
        <div className="bg-black border border-zinc-700 px-3 py-1 rounded-md font-mono text-cyan-400 font-bold min-w-[36px] text-center shadow-inner">
          {countdowns[dir]}
        </div>
      </div>
    );
  };

  const renderControlCard = (dir: 1|2|3|4) => {
    const isEmpty = state.queues[dir].lane1.length === 0 && state.queues[dir].lane2.length === 0;

    return (
      <div className="flex flex-col gap-3 p-4 border border-zinc-700 rounded-xl w-45 shadow-2xl">
        <div className="text-zinc-400 font-mono text-xs uppercase tracking-widest border-b border-zinc-700 pb-2">{dir === 1 ? 'North' : dir === 2 ? 'East' : dir === 3 ? 'South' : 'West'}</div>
        <button 
          onClick={() => dispatch({ type: 'ADD_VEHICLE', dir, vType: 1 })} 
          className="text-[#669DF6] text-sm py-2 border border-[#669DF6] rounded shadow transition-colors"
        >
          <div className="group flex gap-2 items-center justify-center">
            <FaPlusSquare className="w-4 h-4 group-hover:text-[#AECBFA]"></FaPlusSquare>
            <p className="font-medium group-hover:text-[#AECBFA]">Add Car</p>
          </div>
        </button>
        <button 
          onClick={() => dispatch({ type: 'ADD_VEHICLE', dir, vType: 2 })} 
          className="hover:bg-red-900/70 text-red-400 border border-red-400 text-sm py-2 rounded shadow transition-colors"
        >
          <div className="flex gap-2 items-center justify-center">
            <FaPlusSquare className="w-4 h-4"></FaPlusSquare>
            <p className="font-medium">Add Ambulance</p>
          </div>
        </button>
        <button 
          onClick={() => dispatch({ type: 'REMOVE_VEHICLE', dir })} 
          disabled={isEmpty}
          className={`text-sm py-1.5 rounded shadow transition-colors border ${isEmpty ? 'text-[#e8eaed61] border-zinc-800 cursor-not-allowed' : 'hover:bg-zinc-800 text-[#669DF6]'}`}
        >
          <div className="flex gap-2 items-center justify-center">
            <FaMinusSquare className="w-4 h-4"></FaMinusSquare>
            <p className="font-medium">Remove</p>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col items-center font-sans text-zinc-100 selection:bg-cyan-900">
      
      {/* Dashboard */}
      <div className="w-full flex items-center h-12 justify-between mb-5 border-b border-l border-[#3c4043] bg-[#131314] p-1 shadow-xl">
        <div>
          <p className="text-[#ffffff] font-mono text-xl ml-4">Adv. Traffic Signal Simulation</p>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="px-3 py-1 rounded-md text-[#e8eaed61] font-mono font-normal flex items-center gap-2 shadow-inner">
            Status: {state.isRunning ? (state.mode === 'Dormant' ? <span className="">Idle</span> : <span className="">Running ({state.mode})</span>) : <span className="">Paused</span>}
          </div>

          <div className="group flex items-center gap-1 px-2 mr-0 justify-center hover:bg-[#202124] rounded-sm transition-all"
            onClick={() => dispatch({ type: 'TOGGLE_RUN' })}
          >
            {state.isRunning ? <GrPause className="h-4 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/> : <IoPlayOutline className="h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/> }
            <button
              type="button"
              className="text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg py-1 font-medium transition-all"
            >
              {state.isRunning ? 'Pause' : 'Run'}
            </button>
          </div>

          <div className="group flex items-center gap-1 px-2 mr-3 justify-center hover:bg-[#202124] rounded-sm transition-all"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            <RiRefreshLine className="group h-4.5 w-5 text-[#669DF6] group-hover:text-[#AECBFA]"/>
            <button
              type="button"
              className="group text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg py-1 font-medium transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[1200px] justify-between items-center">
        
        <div className="flex flex-col gap-12">
          {renderControlCard(1)}
          {renderControlCard(4)}
        </div>

        {/* --- INTERSECTION GRID --- */}
        <div className="relative w-[700px] h-[700px] bg-zinc-900 border-2 border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex-shrink-0">
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-[270px] bg-black border-x-2 border-zinc-700 flex">
            <div className="flex-1 border-r-2 border-dashed border-white/30 flex flex-col justify-end items-center gap-2 pb-4">
              {[...state.queues[1].lane1].reverse().map((v, i) => renderVehicle(v, i, true))}
            </div>
            <div className="flex-1 flex flex-col justify-end items-center gap-2 pb-4">
              {[...state.queues[1].lane2].reverse().map((v, i) => renderVehicle(v, i, true))}
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-[270px] bg-black border-x-2 border-zinc-700 flex">
             <div className="flex-1 border-r-2 border-dashed border-white/30 flex flex-col justify-start items-center gap-2 pt-4">
              {state.queues[3].lane1.map((v, i) => renderVehicle(v, i, true))}
            </div>
            <div className="flex-1 flex flex-col justify-start items-center gap-2 pt-4">
              {state.queues[3].lane2.map((v, i) => renderVehicle(v, i, true))}
            </div>
          </div>

          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[270px] h-44 bg-black border-y-2 border-zinc-700 flex flex-col">
            <div className="flex-1 border-b-2 border-dashed border-white/30 flex justify-end items-center gap-2 pr-4">
              {[...state.queues[4].lane1].reverse().map((v, i) => renderVehicle(v, i, false))}
            </div>
            <div className="flex-1 flex justify-end items-center gap-2 pr-4">
              {[...state.queues[4].lane2].reverse().map((v, i) => renderVehicle(v, i, false))}
            </div>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[270px] h-44 bg-black border-y-2 border-zinc-700 flex flex-col">
             <div className="flex-1 border-b-2 border-dashed border-white/30 flex justify-start items-center gap-2 pl-4">
              {state.queues[2].lane1.map((v, i) => renderVehicle(v, i, false))}
            </div>
             <div className="flex-1 flex justify-start items-center gap-2 pl-4">
              {state.queues[2].lane2.map((v, i) => renderVehicle(v, i, false))}
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-[black] border-2 border-dashed border-white/30 flex items-center justify-center z-0 rounded-lg">
            <FaLinux className="text-white font-medium font-black text-3xl opacity-40 select-none w-30 h-30"></FaLinux>
          </div>

          {renderLight(1, "top-[90px] left-[450px]")}
          {renderLight(2, "top-[452px] left-[450px]")}
          {renderLight(3, "top-[452px] left-[185px]")}
          {renderLight(4, "top-[90px] left-[185px]")}
        </div>

        <div className="flex flex-col gap-12">
          {renderControlCard(2)}
          {renderControlCard(3)}
        </div>

      </div>
    </div>
  );
}