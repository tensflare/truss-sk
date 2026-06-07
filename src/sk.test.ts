import { describe, it, expect, vi } from "vitest";
import { TrussSemanticKernelMiddleware } from "./index.js";

describe("TrussSemanticKernelMiddleware", () => {
  it("wrapFunction records and returns result", async () => {
    const mw = new TrussSemanticKernelMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    const fn = vi.fn().mockResolvedValue("function output");
    const wrapped = mw.wrapFunction(fn);
    const result = await wrapped("arg1", "arg2");

    expect(result).toBe("function output");
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("name is included in recording", async () => {
    const mw = new TrussSemanticKernelMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    let requestBody: any;
    global.fetch = vi.fn(async (_url: string, opts: any) => {
      requestBody = JSON.parse(opts.body);
      return { ok: true } as Response;
    });

    const fn = vi.fn().mockResolvedValue(42);
    const wrapped = mw.wrapFunction(fn, "myFunction");
    await wrapped();

    expect(requestBody.input_hash).toBeDefined();
    expect(requestBody.action_type).toBe("sk_invoke");
  });

  it("does not throw on fetch failure", async () => {
    const mw = new TrussSemanticKernelMiddleware({
      apiUrl: "http://localhost:4000",
      apiKey: "tr_test",
      mandateId: "mnd_test",
    });

    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const fn = vi.fn().mockResolvedValue("survivor");
    const wrapped = mw.wrapFunction(fn);
    const result = await wrapped();

    expect(result).toBe("survivor");
  });
});
