"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAbyssStateMachine } from "./AbyssStateMachine";
import { ShaderPlane } from "./ShaderPlane";
import { useAbyssReactive } from "@/lib/fracture/audio/AbyssReactive";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";
import { useAudioEngine } from "@/lib/fracture/audio/AudioContextProvider";

interface AbyssIDDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AbyssIDDialog({ open, onClose }: AbyssIDDialogProps) {
  const router = useRouter();
  const { identity } = useAbyssID();
  const {
    state,
    context,
    setUsername,
    startChecking,
    triggerReject,
    triggerAccept,
    startBinding,
    confirmAndProceed,
  } = useAbyssStateMachine();

  // Get audio engine for background ambience
  const { startAudio, isPlaying } = useAudioEngine();

  // Get audio-reactive values for shader
  const reactive = useAbyssReactive(state);

  // Start audio when dialog opens (if not already playing)
  useEffect(() => {
    if (open && !isPlaying) {
      // Small delay to ensure dialog is rendered before starting audio
      const timer = setTimeout(() => {
        startAudio();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, isPlaying, startAudio]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setUsername("");
    }
  }, [open, setUsername]);

  const handleEngage = () => {
    if (context.username.trim()) {
      startChecking();
    }
  };

  const handleEnterHaven = () => {
    confirmAndProceed();
    onClose();
    router.push("/haven");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: reactive.modalScale, 
            y: 0 
          }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-lg mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ShaderPlane backdrop with audio-reactive effects */}
          <ShaderPlane 
            state={state} 
            reactive={{
              low: reactive.low,
              mid: reactive.mid,
              high: reactive.high,
              glitchAmplification: reactive.glitchAmplification,
              pulseEvent: reactive.pulseEvent,
              silenceDecay: reactive.silenceDecay,
            }}
          />
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-6 relative z-10">
            <motion.p 
              className="text-sm text-zinc-400 mb-2"
              style={{
                textShadow: `0 0 ${reactive.textShimmer * 20}px rgba(139, 92, 246, ${reactive.textShimmer})`,
              }}
            >
              THE ABYSS DOES NOT ASK.
            </motion.p>
            <p className="text-sm text-zinc-500">It waits. For you.</p>
          </div>

          {/* IDLE STATE */}
          {state === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 relative z-10"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Enter the name you wish to carry into the dark.
                </label>
                <input
                  type="text"
                  value={context.username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your chosen identity…"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && context.username.trim()) {
                      handleEngage();
                    }
                  }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleEngage}
                disabled={!context.username.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                Engage
              </button>
            </motion.div>
          )}

          {/* CHECKING STATE */}
          {state === "checking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 text-center relative z-10"
            >
              <div className="py-8">
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-lg text-zinc-300"
                >
                  The Abyss considers your worth…
                </motion.div>
                <div className="mt-4 flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* REJECT STATE */}
          {state === "reject" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: reactive.glitchAmplification * 5 
              }}
              className="space-y-6 relative z-10"
            >
              <div className="text-red-400 space-y-2">
                <p className="text-lg font-semibold">Another carried this name.</p>
                <p className="text-zinc-400">They were found unworthy.</p>
                <p className="text-zinc-400">You may choose again.</p>
              </div>
              <div>
                <input
                  type="text"
                  value={context.username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your chosen identity…"
                  className="w-full px-4 py-3 bg-white/5 border border-red-500/30 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={handleEngage}
                disabled={!context.username.trim()}
                className="w-full px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-300 font-semibold rounded-lg hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* ACCEPT STATE */}
          {state === "accept" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: reactive.pulseEvent ? 1.05 : 1 
              }}
              transition={{ duration: 0.5 }}
              className="space-y-6 text-center relative z-10"
            >
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-400">
                  The Abyss remembers you.
                </p>
                <p className="text-zinc-300">
                  You will not be forgotten again.
                </p>
              </div>
              <button
                onClick={startBinding}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105"
              >
                Begin Binding
              </button>
            </motion.div>
          )}

          {/* BINDING STATE */}
          {state === "binding" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 relative z-10"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500">
                  THE BINDING
                </h2>
                <div className="text-zinc-300 text-sm leading-relaxed space-y-1">
                  <p>Your identity is forged below the threshold of light.</p>
                  <p>
                    Guard this key, or the Abyss will consume the memory of you
                  </p>
                  <p>like you never lived.</p>
                </div>
              </div>

              {context.seedPhrase ? (
                <div className="space-y-4">
                  <div className="p-4 bg-black/50 border border-white/10 rounded-lg">
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      Seed Phrase
                    </label>
                    <div className="font-mono text-sm text-zinc-200 break-words">
                      {context.seedPhrase}
                    </div>
                  </div>
                  <button
                    onClick={confirmAndProceed}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105"
                  >
                    I Have Secured My Key
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent"></div>
                  <p className="mt-2 text-zinc-400 text-sm">Forging your key...</p>
                </div>
              )}
            </motion.div>
          )}

          {/* CONFIRM STATE */}
          {state === "confirm" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: 1, 
                scale: reactive.pulseEvent ? 1.05 : 1 
              }}
              transition={{ duration: 0.5 }}
              className="space-y-6 text-center relative z-10"
            >
              <div>
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500">
                  THE VOID OPENS.
                </h2>
                <p className="text-lg text-zinc-300 mb-2">You belong to the dark now.</p>
                <p className="text-zinc-400">Proceed.</p>
              </div>
              <button
                onClick={handleEnterHaven}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                Enter Haven
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}


        </motion.div>
      </div>
    </AnimatePresence>
  );
}
