import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type EditorTheme = "light" | "dark" | "auto";
export const EditorThemeContext = React.createContext<EditorTheme>("auto");
export function useEditorTheme() {
  return React.useContext(EditorThemeContext);
}
