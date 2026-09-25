"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export type AuthMode = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

function AuthModal({ onClose, isOpen, mode, onModeChange }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Frosted Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200/80 p-6 sm:p-8 z-10 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Close Button */}
            <button
              id="auth-modal-close-btn"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Apple-style Brand Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-950 text-white mx-auto shadow-xs">
                <span className="text-lg font-semibold tracking-tighter">
                  A
                </span>
              </div>
              <h2
                id="auth-modal-title"
                className="text-2xl font-semibold tracking-tight text-neutral-950"
              >
                {mode === "signin" ? "Atelier Account" : "Create Atelier ID"}
              </h2>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                {mode === "signin"
                  ? "Đăng nhập để quản lý tài khoản của bạn."
                  : "Tạo tài khoản để bắt đầu mua sắm."}
              </p>
            </div>

            {/* Apple-style Segmented Control */}
            <div className="p-1 bg-neutral-100 rounded-full flex items-center mb-6">
              <button
                type="button"
                id="auth-tab-signin"
                onClick={() => onModeChange("signin")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Đăng Nhập (Sign In)
              </button>
              <button
                type="button"
                id="auth-tab-signup"
                onClick={() => onModeChange("signup")}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-neutral-950 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Đăng Ký (Register)
              </button>
            </div>

            <div className="mt-4">
              {mode === "signin" ? (
                <SignInForm onSuccess={onClose} />
              ) : (
                <SignUpForm onSuccess={onClose} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
