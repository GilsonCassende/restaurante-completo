import type { ThemeMode } from "./app";

declare global {
  interface Window {
    __RESTAURANTPRO__?: {
      theme?: ThemeMode;
    };
  }
}

export {};

