// src/hooks/useBodyScrollLock.js
import { useEffect } from "react";

export default function useBodyScrollLock(isLocked) {
    useEffect(() => {
        if (isLocked) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = "hidden"; // disable scroll
            return () => {
                document.body.style.overflow = originalStyle; // restore on cleanup
            };
        }
    }, [isLocked]);
}
