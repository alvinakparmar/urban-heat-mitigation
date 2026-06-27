import { useState, useEffect, useRef } from 'react';
import { ArrowDown, Thermometer } from 'lucide-react';

const TEMP_MIN = 25;
const TEMP_MAX = 50;

function getHeightPercent(temp) {
  const clamped = Math.max(TEMP_MIN, Math.min(TEMP_MAX, temp));
  return ((clamped - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;
}

function useAnimatedCounter(target, duration = 700) {
  const [value, setValue] = useState(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = value;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) { setValue(target); return; }

    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

export default function ScenarioComparison({ baseTemp, scenarioTemp, interventionType, reduction }) {
  const [mounted, setMounted] = useState(false);
  const animatedScenario = useAnimatedCounter(scenarioTemp, 900);

  useEffect(() => {
    // Trigger mount animation
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [baseTemp, scenarioTemp]);

  // Reset and re-trigger on prop change
  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, [baseTemp, scenarioTemp]);

  const baseHeight = getHeightPercent(baseTemp);
  const scenarioHeight = getHeightPercent(scenarioTemp);

  const interventionLabels = {
    greening: '🌿 Greening',
    cool_roofs: '🏠 Cool Roofs',
    albedo_increase: '☀️ Albedo Boost',
    mixed: '🔀 Mixed Strategy',
  };

  return (
    <div className="w-full">
      {/* Label */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-green-100 dark:from-orange-900/30 dark:to-green-900/30 text-gray-700 dark:text-gray-200">
          <Thermometer className="w-3.5 h-3.5" />
          {interventionLabels[interventionType] || interventionType}
        </span>
      </div>

      {/* Thermometer Container */}
      <div className="flex items-end justify-center gap-6 sm:gap-10 h-56 relative">
        {/* Left Thermometer - Current */}
        <div className="flex flex-col items-center">
          {/* Temperature label */}
          <div className="mb-2 text-center">
            <span className="text-xl font-bold text-red-500">{baseTemp.toFixed(1)}°C</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Current</p>
          </div>
          {/* Bar */}
          <div className="relative w-10 sm:w-12 h-40 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700 ease-out"
              style={{
                height: mounted ? `${baseHeight}%` : '0%',
                background: 'linear-gradient(to top, #ef4444, #f97316, #fbbf24)',
              }}
            />
            {/* Glow */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full blur-sm opacity-40 transition-all duration-700 ease-out"
              style={{
                height: mounted ? `${baseHeight}%` : '0%',
                background: 'linear-gradient(to top, #ef4444, #f97316)',
              }}
            />
          </div>
          {/* Bulb */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-red-400 to-orange-500 -mt-1 shadow-md" />
        </div>

        {/* Center Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className={`
            flex flex-col items-center justify-center
            w-20 h-20 sm:w-24 sm:h-24 rounded-full
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-md
            shadow-lg border-2 border-green-400 dark:border-green-500
            transition-all duration-700 ease-out
            ${mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          `}>
            <ArrowDown className="w-4 h-4 text-green-500 animate-bounce" />
            <span className="text-lg sm:text-xl font-extrabold text-green-600 dark:text-green-400 leading-none">
              {reduction.toFixed(1)}°
            </span>
            <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
              cooler
            </span>
          </div>
        </div>

        {/* Right Thermometer - After */}
        <div className="flex flex-col items-center">
          {/* Temperature label */}
          <div className="mb-2 text-center">
            <span className="text-xl font-bold text-green-500">{animatedScenario.toFixed(1)}°C</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">After</p>
          </div>
          {/* Bar */}
          <div className="relative w-10 sm:w-12 h-40 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700 ease-out delay-200"
              style={{
                height: mounted ? `${scenarioHeight}%` : '0%',
                background: 'linear-gradient(to top, #14b8a6, #22c55e, #86efac)',
              }}
            />
            {/* Glow */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full blur-sm opacity-40 transition-all duration-700 ease-out delay-200"
              style={{
                height: mounted ? `${scenarioHeight}%` : '0%',
                background: 'linear-gradient(to top, #14b8a6, #22c55e)',
              }}
            />
          </div>
          {/* Bulb */}
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-teal-400 to-green-500 -mt-1 shadow-md" />
        </div>
      </div>

      {/* Scale Ticks */}
      <div className="flex justify-center gap-6 sm:gap-10 mt-3">
        <div className="w-10 sm:w-12 flex justify-between text-[9px] text-gray-400">
          <span>{TEMP_MIN}°</span>
          <span>{TEMP_MAX}°</span>
        </div>
        <div className="w-20 sm:w-24" /> {/* spacer for center badge */}
        <div className="w-10 sm:w-12 flex justify-between text-[9px] text-gray-400">
          <span>{TEMP_MIN}°</span>
          <span>{TEMP_MAX}°</span>
        </div>
      </div>
    </div>
  );
}
