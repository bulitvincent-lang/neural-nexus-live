import { LocalHostProvider } from "../providers/localHostProvider";
import type { ActivityProvider } from "../providers/types";
import { BaseConnector } from "./baseConnector";
import type { ActivityLevel, ConnectorId } from "./types";

/**
 * Local connector — an AI running on the same computer (coding agents, local
 * runtimes). Deep activity when the agent shares it, basic otherwise.
 */
export class LocalAgentConnector extends BaseConnector {
  readonly id: ConnectorId = "local-agent";
  readonly level: ActivityLevel = 2;
  protected readonly sources = ["local", "agent", "cli"];

  protected createProvider(): ActivityProvider {
    return new LocalHostProvider();
  }
}
