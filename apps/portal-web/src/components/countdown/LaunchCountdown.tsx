"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

interface CountdownProps {
  targetDate: Date;
  compact?: boolean;
}

export function LaunchCountdown({ targetDate, compact = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-zinc-400">
        <Clock className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const isLaunched = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-genesis-flame-orange" />
        <div className="flex items-center gap-1 font-mono text-sm">
          {isLaunched ? (
            <span className="text-genesis-flame-orange font-bold animate-pulse">
              LIVE NOW
            </span>
          ) : (
            <>
              <span className="text-genesis-cipher-cyan font-semibold">{timeLeft.days}d</span>
              <span className="text-zinc-500">:</span>
              <span className="text-genesis-cipher-cyan font-semibold">{timeLeft.hours.toString().padStart(2, '0')}h</span>
              <span className="text-zinc-500">:</span>
              <span className="text-genesis-cipher-cyan font-semibold">{timeLeft.minutes.toString().padStart(2, '0')}m</span>
              <span className="text-zinc-500">:</span>
              <span className="text-genesis-cipher-cyan font-semibold">{timeLeft.seconds.toString().padStart(2, '0')}s</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLaunched ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-genesis-flame-orange to-genesis-flame-red rounded-2xl shadow-lg">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
            <span className="text-2xl font-bold text-white">
              QOR LAUNCHER LIVE!
            </span>
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((unit, index) => (
            <motion.div
              key={unit.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2 p-4 bg-genesis-glass-light border border-genesis-border-default rounded-xl backdrop-blur-sm"
            >
              <div className="text-3xl md:text-5xl font-bold font-mono bg-gradient-to-br from-genesis-flame-orange to-genesis-cipher-cyan bg-clip-text text-transparent">
                {unit.value.toString().padStart(2, '0')}
              </div>
              <div className="text-xs md:text-sm text-genesis-text-tertiary uppercase tracking-wider">
                {unit.label}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
