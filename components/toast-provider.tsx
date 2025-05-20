"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 5000,
                style: {
                    background: "#fff",
                    color: "#333",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
                success: {
                    style: {
                        borderLeft: "4px solid #22c55e",
                    },
                    iconTheme: {
                        primary: "#22c55e",
                        secondary: "#fff",
                    },
                },
                error: {
                    style: {
                        borderLeft: "4px solid #ef4444",
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                },
            }}
        />
    )
}
