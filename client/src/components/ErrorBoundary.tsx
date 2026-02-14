import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, ArrowRight } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback component for page-level errors */
  fallbackMode?: "full" | "inline";
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isInline = this.props.fallbackMode === "inline";

      if (isInline) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-[#0f1b33] mb-2">حدث خطأ غير متوقع</h3>
            <p className="text-gray-500 text-sm mb-4">An unexpected error occurred</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-4 py-2 bg-[#c8a45e] text-[#0f1b33] rounded-lg font-semibold text-sm hover:bg-[#b8944e] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة المحاولة / Retry
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-[#f8f5f0]">
          <div className="flex flex-col items-center w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-[#E31E24]" />
            </div>

            <h2 className="text-xl font-bold text-[#0f1b33] mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-gray-500 mb-1">An unexpected error occurred</p>
            <p className="text-gray-400 text-sm mb-6">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-3 w-full rounded-lg bg-gray-50 overflow-auto mb-6 text-start" dir="ltr">
                <pre className="text-xs text-gray-500 whitespace-break-spaces">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm",
                  "bg-[#E31E24] text-white hover:bg-[#c91a1f] transition-colors"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                إعادة التحميل
              </button>
              <a
                href="/"
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm",
                  "bg-[#0f1b33] text-white hover:bg-[#1a2b4a] transition-colors"
                )}
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
