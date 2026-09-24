import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Trash2, X, Lock } from 'lucide-react';

export interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
  children?: React.ReactNode;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type = 'warning',
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isDestructive = false,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return isDestructive ? (
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
        );
      case 'success':
        return (
          <div className="w-10 h-10 rounded-2xl bg-[#edf9c7] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-slate-900" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-slate-700" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100 z-10 animate-in zoom-in-95 duration-200">
        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon and Title */}
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Custom Body (if any) */}
        {children && <div className="mt-4">{children}</div>}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-none"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={
                  isDestructive
                    ? 'px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs active:scale-[0.99] border-none'
                    : 'px-4 py-2 rounded-xl text-xs font-bold bg-[#c6ef4e] hover:bg-[#b5e03b] text-black transition-all cursor-pointer shadow-xs active:scale-[0.99] border-none'
                }
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#c6ef4e] hover:bg-[#b5e03b] text-black transition-all cursor-pointer shadow-xs active:scale-[0.99] border-none"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
