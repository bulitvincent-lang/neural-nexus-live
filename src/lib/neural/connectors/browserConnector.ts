import { MCPActivityProvider } from "../providers/mcpProvider";
import type { ActivityProvider } from "../providers/types";
import { BaseConnector } from "./baseConnector";
import type { ActivityLevel, ConnectorId } from "./types";

/**
 * Browser connector — the mainstream path.
 *
 * The user keeps using chatgpt.com / claude.ai / gemini.google.com exactly as
 * before. A small companion piece in their browser reports *activity only*
 * (started, streaming, finished, error) to the app's internal bridge. No prompt
 * text, no answers, no files, no conversation ever travels.
 *
 * Level 1: basic activity — the engine extrapolates the rest organically.
 */
export class BrowserConnector extends BaseConnector {
  readonly id: ConnectorId = "browser";
  readonly level: ActivityLevel = 1;
  protected readonly sources = ["browser"];

  protected createProvider(): ActivityProvider {
    return new MCPActivityProvider();
  }
}
