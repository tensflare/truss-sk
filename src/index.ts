import { createHash } from "node:crypto";

export interface TrussSemanticKernelOptions {
  apiUrl: string;
  apiKey: string;
  mandateId: string;
}

const hash = (data: string) => `sha256:${createHash("sha256").update(data).digest("hex")}`;

export class TrussSemanticKernelMiddleware {
  private apiUrl: string;
  private apiKey: string;
  private mandateId: string;

  constructor(opts: TrussSemanticKernelOptions) {
    this.apiUrl = opts.apiUrl;
    this.apiKey = opts.apiKey;
    this.mandateId = opts.mandateId;
  }

  wrapFunction<T extends (...args: any[]) => any>(fn: T, name?: string): T {
    const self = this;
    const label = name ?? "unnamed";
    return ((...args: any[]) => {
      const result = fn(...args);
      const resolved = result instanceof Promise ? result : Promise.resolve(result);
      return resolved.then((val: any) => {
        try {
          fetch(`${self.apiUrl}/actions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${self.apiKey}`,
            },
            body: JSON.stringify({
              mandate_id: self.mandateId,
              action_type: "sk_invoke",
              input_hash: hash(JSON.stringify({ name: label, args })),
              output_hash: hash(JSON.stringify(val)),
            }),
          }).catch(() => {});
        } catch {
          // fail open
        }
        return val;
      });
    }) as T;
  }
}
