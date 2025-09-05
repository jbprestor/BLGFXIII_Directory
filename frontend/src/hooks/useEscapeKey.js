export default function useEscapeKey() {
    const useEscapeKey = (callback) => {
        useEffect(() => {
            const handleEscape = (event) => {
                if (event.key === "Escape") {
                    callback();
                }
            };

            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }, [callback]);
    };
    return useEscapeKey;
}