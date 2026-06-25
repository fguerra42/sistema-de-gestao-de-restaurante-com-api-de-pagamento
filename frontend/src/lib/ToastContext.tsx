"use client"
import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react"

interface Toast {
    id: number
    message: string
    type: "success" | "error" | "info"
    leaving?: boolean
}

interface ToastContextType {
    toast: (message: string, type?: "success" | "error" | "info") => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const idRef = useRef(0)

    const toast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
        const id = ++idRef.current
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 300)
        }, 4000)
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-3 ${
                            t.leaving ? "animate-slide-out" : "animate-slide-in"
                        } ${
                            t.type === "success"
                                ? "bg-green-900/90 border-green-700 text-green-200"
                                : t.type === "error"
                                ? "bg-red-900/90 border-red-700 text-red-200"
                                : "bg-gray-800/90 border-gray-700 text-gray-200"
                        }`}
                    >
                        <span className="text-lg flex-shrink-0">
                            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
                        </span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
