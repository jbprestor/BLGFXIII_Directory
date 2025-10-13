// Theme configuration - 4 Essential Themes
export default function Theme() {
  const themes = {
    corporate: {
      name: "Corporate Blue",
      daisyTheme: "corporate",
      gradient: "from-primary via-primary-focus to-secondary",
      accent: "primary",
      icon: "🌊",
      colors: { primary: "#570df8", secondary: "#f000b8", accent: "#37cdbe" },
      shadow: "0 4px 14px 0 rgba(87, 13, 248, 0.2)",
      border: "1px solid rgba(87, 13, 248, 0.15)",
    },
    synthwave: {
      name: "Synthwave Neon",
      daisyTheme: "synthwave",
      gradient: "from-primary to-secondary",
      accent: "secondary",
      icon: "🌈",
      colors: { primary: "#e779c1", secondary: "#58c7f3", accent: "#f3cc30" },
      shadow: "0 4px 14px 0 rgba(231, 121, 193, 0.25)",
      border: "1px solid rgba(231, 121, 193, 0.2)",
    },
    cyberpunk: {
      name: "Cyberpunk Dark",
      daisyTheme: "cyberpunk",
      gradient: "from-accent via-primary to-secondary",
      accent: "accent",
      icon: "🤖",
      colors: { primary: "#ff7598", secondary: "#75d1f0", accent: "#c7f59b" },
      shadow: "0 4px 14px 0 rgba(255, 117, 152, 0.25)",
      border: "1px solid rgba(255, 117, 152, 0.2)",
    },
    valentine: {
      name: "Valentine Pink",
      daisyTheme: "valentine",
      gradient: "from-primary via-primary-focus to-secondary",
      accent: "secondary",
      icon: "💖",
      colors: { primary: "#e96d7b", secondary: "#a991f7", accent: "#88dbdd" },
      shadow: "0 4px 14px 0 rgba(233, 109, 123, 0.2)",
      border: "1px solid rgba(233, 109, 123, 0.15)",
    },
  };
  return themes;
}
