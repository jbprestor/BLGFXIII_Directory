// src/data/themes.js
export const themes = {
  default: {
    name: "Corporate Blue",
    daisyTheme: "corporate",
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    accent: "primary",
    icon: "🌊",
    colors: {
      primary: "#570df8",
      secondary: "#f000b8",
      accent: "#37cdbe",
    },
  },
  emerald: {
    name: "Emerald Forest",
    daisyTheme: "emerald",
    gradient: "from-emerald-600 via-green-600 to-teal-700",
    accent: "success",
    icon: "🌲",
    colors: {
      primary: "#059669",
      secondary: "#10b981",
      accent: "#14b8a6",
    },
  },
  sunset: {
    name: "Sunset Warmth",
    daisyTheme: "sunset",
    gradient: "from-orange-500 via-red-500 to-pink-600",
    accent: "warning",
    icon: "🌅",
    colors: {
      primary: "#ea580c",
      secondary: "#f97316",
      accent: "#fb923c",
    },
  },
  synthwave: {
    name: "Synthwave Neon",
    daisyTheme: "synthwave",
    gradient: "from-purple-600 via-pink-600 to-blue-600",
    accent: "secondary",
    icon: "🌈",
    colors: {
      primary: "#e779c1",
      secondary: "#58c7f3",
      accent: "#f3cc30",
    },
  },
  retro: {
    name: "Retro Vintage",
    daisyTheme: "retro",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    accent: "warning",
    icon: "📻",
    colors: {
      primary: "#ef9995",
      secondary: "#a4cbb4",
      accent: "#dc8850",
    },
  },
  cyberpunk: {
    name: "Cyberpunk Dark",
    daisyTheme: "cyberpunk",
    gradient: "from-yellow-400 via-pink-500 to-purple-600",
    accent: "accent",
    icon: "🤖",
    colors: {
      primary: "#ff7598",
      secondary: "#75d1f0",
      accent: "#c7f59b",
    },
  },
  valentine: {
    name: "Valentine Pink",
    daisyTheme: "valentine",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    accent: "secondary",
    icon: "💖",
    colors: {
      primary: "#e96d7b",
      secondary: "#a991f7",
      accent: "#88dbdd",
    },
  },
  aqua: {
    name: "Aqua Marine",
    daisyTheme: "aqua",
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    accent: "info",
    icon: "🌊",
    colors: {
      primary: "#09ecf3",
      secondary: "#966fb3",
      accent: "#ffe999",
    },
  },
};

// Helper function to get a theme by key
export const getTheme = (themeKey) => {
  return themes[themeKey] || themes.default;
};

// Helper function to get all theme keys
export const getThemeKeys = () => {
  return Object.keys(themes);
};

// Helper function to get the default theme
export const getDefaultTheme = () => {
  return themes.default;
};
