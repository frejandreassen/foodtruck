"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "loading"

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose?: () => void
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Determine background color based on type
  const getBackgroundColor = () => {
    switch(type) {
      case "success": return "bg-green-100 border-green-500 text-green-800"
      case "error": return "bg-red-100 border-red-500 text-red-800"
      case "loading": return "bg-blue-100 border-blue-500 text-blue-800"
      default: return "bg-gray-100 border-gray-500 text-gray-800"
    }
  }

  // Determine icon based on type
  const getIcon = () => {
    switch(type) {
      case "success": return "✓"
      case "error": return "✕"
      case "loading": return (
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
      )
      default: return "ℹ"
    }
  }

  // Handle close
  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      setTimeout(onClose, 300) // Allow animation to complete
    }
  }

  // Auto-close after duration
  useEffect(() => {
    if (duration && type !== "loading") {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, type])

  if (!isVisible) return null

  return createPortal(
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center p-4 mb-4 max-w-xs border rounded-lg shadow-lg transition-all duration-300 ${getBackgroundColor()} ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-2">
        {getIcon()}
      </div>
      <div className="text-sm font-normal">{message}</div>
      <button 
        type="button" 
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-gray-200 hover:text-gray-900 focus:ring-2 focus:ring-gray-300"
        onClick={handleClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>,
    document.getElementById("toast-container") as HTMLElement
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<{id: string, props: ToastProps}[]>([])

  const showToast = (message: string, type: ToastType = "info", duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      props: {
        message,
        type,
        duration,
        onClose: () => {
          setToasts(current => current.filter(t => t.id !== id))
        }
      }
    }
    setToasts(current => [...current, newToast])
    return id
  }

  const updateToast = (id: string, props: Partial<ToastProps>) => {
    setToasts(current => 
      current.map(t => 
        t.id === id ? { ...t, props: { ...t.props, ...props } } : t
      )
    )
  }

  const dismissToast = (id: string) => {
    setToasts(current => current.filter(t => t.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map(({ id, props }) => (
        <Toast key={id} {...props} />
      ))}
    </>
  )

  return {
    showToast,
    updateToast,
    dismissToast,
    ToastContainer
  }
}