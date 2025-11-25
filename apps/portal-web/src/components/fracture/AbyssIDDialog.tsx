"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { AbyssStateMachine, type AbyssState } from "./AbyssStateMachine";
import { ShaderPlane } from "./ShaderPlane";
import { useAbyssReactive } from "@/lib/fracture/audio/AbyssReactive";
import { generateAbyssKeys } from "@/lib/fracture/crypto/generateKeys";
import { resolveUsername } from "@/lib/rpc";

interface AbyssIDDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AbyssIDDialog({ open, onClose }: AbyssIDDialogProps) {
  const router = useRouter();
  const [stateMachine] = useState(() => new AbyssStateMachine());
  const [state, setState] = useState<AbyssState>("idle");
  const [username, setUsername] = useState("");
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string; seedPhrase: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const checkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactive = useAbyssReactive(state);

  useEffect(() => {
    if (!open) {
      stateMachine.reset();
      setState("idle");
      setUsername("");
      setKeys(null);
      setShowKey(false);
      setIsGenerating(false);
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }
    }
  }, [open, stateMachine]);

  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [stateMachine]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.trim()) {
      // Start checking after a brief delay
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current);
      }
      checkingTimeoutRef.current = setTimeout(() => {
        checkAvailability(value.trim());
      }, 500);
    } else {
      stateMachine.reset();
    }
  };

  const checkAvailability = async (name: string) => {
    stateMachine.checkUsername(name);

    try {
      // Check username availability via RPC
      const result = await resolveUsername(name);
      
      // If username resolves, it's taken
      if (result && result.address) {
        // Simulate checking delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        stateMachine.rejectUsername();
      } else {
        // Username is available
        await new Promise((resolve) => setTimeout(resolve, 1500));
        stateMachine.acceptUsername();
      }
    } catch (error) {
      // On error, assume available (or handle appropriately)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      stateMachine.acceptUsername();
    }
  };

  const handleRevealKey = async () => {
    if (keys) {
      setShowKey(true);
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateAbyssKeys();
      const keyData = {
        publicKey: generated.publicKey,
        privateKey: generated.privateKey,
        seedPhrase: generated.seedPhrase,
      };
      setKeys(keyData);
      stateMachine.startBinding(
        keyData.publicKey,
        keyData.privateKey,
        keyData.seedPhrase
      );
      setShowKey(true);
    } catch (error) {
      console.error("Failed to generate keys:", error);
      // TODO: Show error state
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = () => {
    stateMachine.confirm();
    // TODO: Store keys and username in localStorage/backend
    setTimeout(() => {
      router.push("/haven");
      onClose();
    }, 1000);
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
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />

        {/* Shader Plane */}
        <ShaderPlane state={state} />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{
            opacity: 1,
            scale: reactive.modalScale,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="relative w-full max-w-2xl bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-8 sm:p-12">
            {/* IDLE STATE */}
            {state === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-center"
              >
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500">
                      THE ABYSS DOES NOT ASK.
                    </span>
                  </h2>
                  <p className="text-lg sm:text-xl text-zinc-400 space-y-2">
                    <span>It waits.</span>
                    <br />
                    <span>For you.</span>
                  </p>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-3 text-left">
                    Enter the name you wish to carry into the dark.
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="your chosen identity…"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-lg"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* CHECKING STATE */}
            {state === "checking" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 text-center"
              >
                <motion.div
                  animate={{
                    scale: [1, 0.88, 1, 0.88, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <h3 className="text-2xl sm:text-3xl font-semibold text-zinc-300 mb-4">
                    The Abyss considers your worth…
                  </h3>
                </motion.div>
              </motion.div>
            )}

            {/* REJECT STATE */}
            {state === "reject" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="space-y-6 text-center"
              >
                <div className="text-red-400">
                  <h3 className="text-2xl sm:text-3xl font-semibold mb-4">
                    Another carried this name.
                  </h3>
                  <p className="text-lg text-zinc-400 mb-2">
                    They were found unworthy.
                  </p>
                  <p className="text-lg text-zinc-400">
                    You may choose again.
                  </p>
                </div>

                <div className="pt-4">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="your chosen identity…"
                    className="w-full px-6 py-4 bg-white/5 border border-red-500/30 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-lg"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {/* ACCEPT STATE */}
            {state === "accept" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="space-y-8 text-center"
              >
                <div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-green-400 mb-4">
                    The Abyss remembers you.
                  </h3>
                  <p className="text-lg text-zinc-300">
                    You will not be forgotten again.
                  </p>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={handleRevealKey}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 text-lg"
                >
                  Proceed to Binding
                </motion.button>
              </motion.div>
            )}

            {/* BINDING STATE */}
            {state === "binding" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500">
                      THE BINDING
                    </span>
                  </h2>
                  <div className="text-zinc-300 text-lg leading-relaxed space-y-2 max-w-xl mx-auto">
                    <p>Your identity is forged below the threshold of light.</p>
                    <p>
                      Guard this key, or the Abyss will consume the memory of you
                    </p>
                    <p>like you never lived.</p>
                  </div>
                </div>

                {isGenerating ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
                    <p className="mt-4 text-zinc-400">Forging your key...</p>
                  </div>
                ) : keys ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      {showKey ? (
                        <>
                          <EyeOff className="h-5 w-5" />
                          Hide Key
                        </>
                      ) : (
                        <>
                          <Eye className="h-5 w-5" />
                          Reveal Key
                        </>
                      )}
                    </button>

                    {showKey && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 p-6 bg-black/50 border border-white/10 rounded-lg"
                      >
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Seed Phrase
                          </label>
                          <div className="p-4 bg-black/50 border border-white/5 rounded font-mono text-sm text-zinc-200 break-words">
                            {keys.seedPhrase}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Private Key
                          </label>
                          <div className="p-4 bg-black/50 border border-white/5 rounded font-mono text-xs text-zinc-300 break-all">
                            {keys.privateKey}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Public Key
                          </label>
                          <div className="p-4 bg-black/50 border border-white/5 rounded font-mono text-xs text-zinc-300 break-all">
                            {keys.publicKey}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={handleConfirm}
                      className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 text-lg flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>
                  </div>
                ) : (
                  <button
                    onClick={handleRevealKey}
                    className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 text-cyan-300 font-semibold rounded-lg hover:from-cyan-500/30 hover:to-fuchsia-500/30 transition-all duration-200 text-lg"
                  >
                    Reveal Key
                  </button>
                )}
              </motion.div>
            )}

            {/* CONFIRM STATE */}
            {state === "confirm" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 text-center"
              >
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500">
                      THE VOID OPENS.
                    </span>
                  </h2>
                  <p className="text-lg text-zinc-300 mb-8">
                    You belong to the dark now.
                  </p>
                  <p className="text-lg text-zinc-400 mb-8">
                    Proceed.
                  </p>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleConfirm}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 text-lg flex items-center justify-center gap-2 mx-auto"
                >
                  Enter Haven
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
