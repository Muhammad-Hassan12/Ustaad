"use client";

import React from "react";
import { motion } from "framer-motion";

export interface LedgerCheckpoint {
  label: string;
  status: "pending" | "active" | "complete";
}

interface LedgerLineProps {
  orientation?: "horizontal" | "vertical";
  variant?: "on-ink" | "on-parchment";
  checkpoints: LedgerCheckpoint[];
  className?: string;
}

export default function LedgerLine({
  orientation = "horizontal",
  variant = "on-ink",
  checkpoints,
  className = "",
}: LedgerLineProps) {
  const isHorizontal = orientation === "horizontal";
  const isOnParchment = variant === "on-parchment";

  if (isHorizontal) {
    return (
      <div className={`w-full flex flex-col ${className}`}>
        {/* Row 1: Checkpoint Dots & Connecting Lines */}
        <div className="flex flex-row items-center justify-between w-full relative px-2">
          {checkpoints.map((checkpoint, index) => (
            <React.Fragment key={index}>
              {/* Dot */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0.4 }}
                animate={{
                  scale: checkpoint.status === "active" ? 1.15 : 1,
                  opacity: checkpoint.status === "pending" ? 0.4 : 1,
                }}
                transition={{ duration: 0.4 }}
                className={`
                  w-4 h-4 rounded-full border-2 border-brass z-10 shrink-0 transition-colors duration-300 flex items-center justify-center
                  ${
                    checkpoint.status === "complete"
                      ? "bg-brass shadow-[0_0_8px_rgba(201,169,97,0.5)]"
                      : checkpoint.status === "active"
                      ? isOnParchment
                        ? "bg-parchment ring-2 ring-brass/40 animate-pulse"
                        : "bg-ink ring-2 ring-brass/40 animate-pulse"
                      : isOnParchment
                      ? "bg-parchment"
                      : "bg-ink"
                  }
                `}
              >
                {checkpoint.status === "complete" && (
                  <span className="text-[9px] font-bold text-ink leading-none">✓</span>
                )}
              </motion.div>

              {/* Connecting Line between dots */}
              {index < checkpoints.length - 1 && (
                <div className="flex-1 h-[2px] bg-warm-gray/20 relative mx-1">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: checkpoint.status === "complete" ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    style={{ transformOrigin: "left" }}
                    className="absolute inset-0 bg-brass"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Row 2: Text Labels cleanly aligned underneath their dots */}
        <div className="flex flex-row justify-between items-start mt-2.5 w-full px-2">
          {checkpoints.map((checkpoint, index) => {
            const alignClass =
              index === 0
                ? "text-left"
                : index === checkpoints.length - 1
                ? "text-right"
                : "text-center";

            return (
              <div key={index} className={`flex-1 ${alignClass}`}>
                <span
                  className={`text-xs font-body leading-tight inline-block ${
                    checkpoint.status === "active"
                      ? "text-brass font-bold"
                      : checkpoint.status === "complete"
                      ? isOnParchment
                        ? "text-ink font-semibold"
                        : "text-parchment font-medium"
                      : isOnParchment
                      ? "text-ink/50"
                      : "text-warm-gray/60"
                  } transition-colors duration-300`}
                >
                  {checkpoint.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={`flex flex-col items-start gap-5 w-full ${className}`}>
      {checkpoints.map((checkpoint, index) => (
        <div key={index} className="flex flex-row items-center relative w-full">
          {/* Checkpoint tick mark */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0.4 }}
            animate={{
              scale: checkpoint.status === "active" ? 1.15 : 1,
              opacity: checkpoint.status === "pending" ? 0.4 : 1,
            }}
            transition={{ duration: 0.4 }}
            className={`
              w-4 h-4 rounded-full border-2 border-brass z-10 shrink-0 transition-colors duration-300 flex items-center justify-center
              ${
                checkpoint.status === "complete"
                  ? "bg-brass shadow-[0_0_8px_rgba(201,169,97,0.5)]"
                  : checkpoint.status === "active"
                  ? isOnParchment
                    ? "bg-parchment ring-2 ring-brass/40 animate-pulse"
                    : "bg-ink ring-2 ring-brass/40 animate-pulse"
                  : isOnParchment
                  ? "bg-parchment"
                  : "bg-ink"
              }
            `}
          >
            {checkpoint.status === "complete" && (
              <span className="text-[9px] font-bold text-ink leading-none">✓</span>
            )}
          </motion.div>

          <span
            className={`text-xs font-body ${
              checkpoint.status === "active"
                ? "text-brass font-bold"
                : checkpoint.status === "complete"
                ? isOnParchment
                  ? "text-ink font-semibold"
                  : "text-parchment"
                : isOnParchment
                ? "text-ink/50"
                : "text-warm-gray/60"
            } ml-3.5 transition-colors duration-300`}
          >
            {checkpoint.label}
          </span>

          {/* Vertical Connecting Line */}
          {index < checkpoints.length - 1 && (
            <div className="absolute left-[7px] top-[16px] w-[2px] h-[calc(100%+20px)] bg-warm-gray/20 -z-0">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: checkpoint.status === "complete" ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ transformOrigin: "top" }}
                className="absolute inset-0 bg-brass"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
