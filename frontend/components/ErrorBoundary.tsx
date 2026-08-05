"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4 border-l-4 border-critical-red bg-critical-red/10 text-parchment rounded-sm font-body">
          <AlertTriangle className="w-10 h-10 text-critical-red" />
          <h3 className="font-display text-2xl text-parchment">
            Something went wrong
          </h3>
          <p className="font-body text-xs text-warm-gray max-w-sm">
            {this.props.fallbackMessage || "An unexpected error occurred while rendering this section."}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-2 px-6 py-2.5 rounded-sm bg-brass text-ink font-body text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-brass/90 transition-colors"
          >
            <RotateCcw size={12} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
