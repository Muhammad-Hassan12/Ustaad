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
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4 border border-rose-200 dark:border-rose-950 bg-rose-50/5 dark:bg-rose-950/5 rounded-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Something went wrong
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {this.props.fallbackMessage || "An unexpected error occurred while rendering this section."}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw size={12} /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
