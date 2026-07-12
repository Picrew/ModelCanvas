/// <reference types="vite/client" />

declare module "epubjs" {
  interface Rendition {
    display(target?: string): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    themes: {
      select(name: string): void;
      fontSize(size: string): void;
      register(
        name: string,
        rules: Record<string, Record<string, string>>,
      ): void;
    };
    on(
      event: "relocated",
      callback: (location: { start: { percentage?: number } }) => void,
    ): void;
    destroy(): void;
  }
  interface NavigationItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavigationItem[];
  }
  interface Book {
    ready: Promise<void>;
    loaded: { navigation: Promise<{ toc: NavigationItem[] }> };
    renderTo(element: HTMLElement, options: Record<string, unknown>): Rendition;
    destroy(): void;
  }
  export default function ePub(source: string | ArrayBuffer): Book;
}
