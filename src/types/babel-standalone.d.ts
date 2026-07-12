declare module "@babel/standalone" {
  export function transform(
    source: string,
    options: Record<string, unknown>,
  ): { code?: string | null };
}
