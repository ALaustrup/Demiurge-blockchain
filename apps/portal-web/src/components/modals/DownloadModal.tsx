"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, AlertCircle } from "lucide-react";
import { LaunchCountdown } from "../countdown/LaunchCountdown";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  launchDate: Date;
}

export function DownloadModal({ open, onClose, launchDate }: DownloadModalProps) {
  const isLaunched = launchDate.getTime() <= new Date().getTime();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 p-4"
          >
            <div className="bg-genesis-void-black border-2 border-genesis-flame-orange rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-br from-genesis-flame-orange/20 to-genesis-cipher-cyan/20 border-b border-genesis-border-default">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 p-2 rounded-lg text-genesis-text-tertiary hover:text-genesis-text-primary hover:bg-genesis-glass-light transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-genesis-flame-orange to-genesis-flame-red">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-genesis-text-primary">
                      DEMIURGE QOR Launcher
                    </h2>
                    <p className="text-sm text-genesis-text-tertiary">
                      Your gateway to the sovereign ecosystem
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {isLaunched ? (
                  <>
                    {/* Download Available */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-semibold text-green-400">
                          Now Available
                        </span>
                      </div>
                      
                      <p className="text-genesis-text-secondary">
                        The QOR Launcher is ready for download. Choose your platform:
                      </p>
                    </div>

                    {/* Download Buttons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.a
                        href="https://releases.demiurge.cloud/qor/latest/windows"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-genesis-flame-orange to-genesis-flame-red rounded-xl text-white font-semibold hover:shadow-lg transition-shadow"
                      >
                        <Download className="h-5 w-5" />
                        Download for Windows
                      </motion.a>

                      <motion.a
                        href="https://releases.demiurge.cloud/qor/latest/macos"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-genesis-cipher-cyan to-genesis-void-purple rounded-xl text-white font-semibold hover:shadow-lg transition-shadow"
                      >
                        <Download className="h-5 w-5" />
                        Download for macOS
                      </motion.a>
                    </div>

                    <div className="p-4 bg-genesis-glass-light border border-genesis-border-default rounded-xl">
                      <h3 className="text-sm font-semibold text-genesis-text-primary mb-2">
                        What's Included:
                      </h3>
                      <ul className="text-sm text-genesis-text-secondary space-y-1">
                        <li>• QOR ID authentication & wallet</li>
                        <li>• One-click blockchain node deployment</li>
                        <li>• Integrated mining & staking</li>
                        <li>• Direct access to QOR OS desktop environment</li>
                        <li>• Auto-updates & system notifications</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Countdown */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-genesis-flame-orange/20 border border-genesis-flame-orange/30 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-genesis-flame-orange" />
                        <span className="text-sm font-semibold text-genesis-flame-orange">
                          Alpha Launch Countdown
                        </span>
                      </div>
                      
                      <p className="text-genesis-text-secondary">
                        The QOR Launcher will be available for download in:
                      </p>
                    </div>

                    <LaunchCountdown targetDate={launchDate} />

                    <div className="p-4 bg-genesis-glass-light border border-genesis-border-default rounded-xl">
                      <h3 className="text-sm font-semibold text-genesis-text-primary mb-2">
                        Get Ready:
                      </h3>
                      <ul className="text-sm text-genesis-text-secondary space-y-1">
                        <li>• Create your QOR ID now (see below)</li>
                        <li>• Minimum 8GB RAM, 100GB storage recommended</li>
                        <li>• Windows 10/11 or macOS 12+ supported</li>
                        <li>• Stable internet connection required</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
