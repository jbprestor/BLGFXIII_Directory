import { useState, useEffect } from "react";
import { getDefaultOrdinances } from "../utils/qrrpa/defaultOrdinances";

export const useOrdinanceConfig = () => {
    const [ordinanceConfig, setOrdinanceConfig] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('qrrpa_ordinance_config');
        if (saved) {
            try {
                setOrdinanceConfig(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved config", e);
                setOrdinanceConfig(getDefaultOrdinances());
            }
        } else {
            setOrdinanceConfig(getDefaultOrdinances());
        }
        setIsLoading(false);
    }, []);

    // Save to localStorage
    const saveConfig = (newConfig) => {
        setOrdinanceConfig(newConfig);
        localStorage.setItem('qrrpa_ordinance_config', JSON.stringify(newConfig));
    };

    return { ordinanceConfig, saveConfig, isLoading };
};
