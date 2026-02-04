export class Parser {

    static parseMiddleware<T>(json: Record<string, unknown>, requiredKeys: (keyof T)[] = []): boolean {
        if (typeof json !== "object" || json === null) {
            return false;
        }

        const data = json as Record<string, unknown>;
        if (data === undefined) {
            return false;
        }
        for (const key of requiredKeys) {
            if (!(key in data)) {
                return false;
            }
        }

        return true;
    }

    
    static safeJson(text: string): Record<string, unknown>  | null {

      try {
        return JSON.parse(text);
      } catch {
          return null;
      }

    }
}
