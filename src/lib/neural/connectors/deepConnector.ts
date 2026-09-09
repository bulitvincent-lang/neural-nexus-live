import { MCPActivityProvider } from "../providers/mcpProvider";
import type { ActivityProvider } from "../providers/types";
import { BaseConnector } from "./baseConnector";
import type { ActivityLevel, ConnectorId } from "./types";

/**
 * Deep connector — anything that can describe its inner work (tools, memory,
 * searches, parallel tasks). Kept for advanced setups; never surfaced as such.
 */
export class DeepConnector extends BaseConnector {
  readonly id: ConnectorId = "deep";
  readonly level: ActivityLevel = 2;
  protected readonly sources = ["mcp", "deep", "tool", ""];

  protected createProvider(): ActivityProvider {
    return new MCPActivityProvider();
  }
}
