"use client";

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { createContext, useContext } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider {...props}>
      <ThemeContextBridge>{children}</ThemeContextBridge>
    </NextThemesProvider>
  );
}

function ThemeContextBridge({ children }) {
  const { theme, setTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
