import * as React from "react";
import { X, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "warning" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "default",
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    default: "border-[#CBD8D1] bg-white",
    destructive: "border-red-300 bg-red-50",
    warning: "border-amber-300 bg-amber-50",
    success: "border-emerald-300 bg-emerald-50",
  };

  const iconMap = {
    default: null,
    destructive: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  };

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full rounded-2xl shadow-2xl animate-slide-up",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-[#EAEFEA]">
          <div className="flex items-start gap-3">
            {variant !== "default" && iconMap[variant] && (
              <div className="flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-[#18231F]">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-[#6B8579] mt-1">{description}</p>
              )}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-[#6B8579] hover:bg-[#F0F4F1] hover:text-[#18231F] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "default";
  isLoading?: boolean;
  className?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  className,
}) => {
  const variantStyles = {
    default: "bg-[#163D32] hover:bg-[#205244] text-white",
    destructive: "bg-[#E11D48] hover:bg-[#BE123C] text-white",
    warning: "bg-[#D99A37] hover:bg-[#C4892E] text-white",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      size="sm"
      className={className}
    >
      <p className="text-sm text-[#18231F] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-[#163D32] bg-white border border-[#CBD8D1] rounded-lg hover:bg-[#F0F4F1] transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50",
            variantStyles[variant]
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
};

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
  duration = 4000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    error: <AlertCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    info: <AlertCircle className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-right max-w-sm",
        typeStyles[type]
      )}
      role="alert"
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: "success" | "error" | "warning" | "info";
  }>;
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};