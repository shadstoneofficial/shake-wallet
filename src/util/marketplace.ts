export const DEFAULT_SHAKEDEX_CHANNEL = "market.learnhns.com";
export const DEFAULT_SHAKEDEX_MARKET_ORIGIN = `https://${DEFAULT_SHAKEDEX_CHANNEL}`;

export function normalizeShakedexMarketOrigin(channel: string): string {
  const raw = (channel || DEFAULT_SHAKEDEX_CHANNEL).trim();
  const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Marketplace channel must use HTTP or HTTPS.");
  }

  return url.origin;
}

export function getShakedexChannelHost(channel: string): string {
  return new URL(normalizeShakedexMarketOrigin(channel)).host;
}
