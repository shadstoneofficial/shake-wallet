import {GenericService} from "@src/util/svc";
const bdb = require("bdb");
const DB = require("bdb/lib/db");
import {get, put} from "@src/util/db";
import {type Explorer, EXPLORERS} from "@src/util/explorer";
import {
  DEFAULT_SHAKEDEX_CHANNEL,
  getShakedexChannelHost,
} from "@src/util/marketplace";

const RPC_HOST_DB_KEY = "rpc_host";
const RPC_API_KEY_DB_KEY = "rpc_api_key";
const ANALYTICS_OPT_IN_KEY = "analytics_opt_in_key";
const MULTI_ACCOUNTS_ENABLED_KEY = "multi_accounts_enabled_key";
const EXPLORER_KEY = "explorer_key";
const SHAKEDEX_CHANNEL_KEY = "shakedex_channel_key";
const SECURITY_LOCK_TIMEOUT_KEY = "security_lock_timeout_key";

const DEFAULT_HOST =
  process.env.DEFAULT_HOST || "https://api.handshakeapi.com/hsd";
const DEFAULT_API_KEY = process.env.DEFAULT_API_KEY || "";
const DEFAULT_SECURITY_LOCK_TIMEOUT = 15;

declare interface SettingService {
  apiHost: string;
  apiKey: string;
}

class SettingService extends GenericService {
  store: typeof DB;

  constructor() {
    super();
    this.apiHost = "";
    this.apiKey = "";
  }

  getAPI = async () => {
    const apiHost = this.apiHost || (await get(this.store, RPC_HOST_DB_KEY));
    const apiKey = this.apiKey || (await get(this.store, RPC_API_KEY_DB_KEY));

    return {
      apiHost: apiHost || DEFAULT_HOST,
      apiKey: apiKey || DEFAULT_API_KEY,
    };
  };

  setRPCHost = async (apiHost: string) => {
    await put(this.store, RPC_HOST_DB_KEY, apiHost);
    this.apiHost = apiHost;
    return true;
  };

  setRPCKey = async (apiKey: string) => {
    await put(this.store, RPC_API_KEY_DB_KEY, apiKey);
    this.apiKey = apiKey;
    return true;
  };

  setAnalytics = async (optIn = false) => {
    await put(this.store, ANALYTICS_OPT_IN_KEY, optIn);
    return true;
  };

  getAnalytics = async () => {
    const optIn = await get(this.store, ANALYTICS_OPT_IN_KEY);
    return !!optIn;
  };

  setMultiAccountsEnabled = async (enabled = false) => {
    await put(this.store, MULTI_ACCOUNTS_ENABLED_KEY, enabled);
    return true;
  };

  getMultiAccountsEnabled = async () => {
    const enabled = await get(this.store, MULTI_ACCOUNTS_ENABLED_KEY);
    return !!enabled;
  };

  setExplorer = async (explorer: Explorer) => {
    await put(this.store, EXPLORER_KEY, JSON.stringify(explorer));
    return true;
  };

  getExplorer = async () => {
    const explorer = await get(this.store, EXPLORER_KEY);
    if (!explorer) return EXPLORERS[0];
    return normalizeExplorer(JSON.parse(explorer));
  };

  setShakedexChannel = async (channel: string) => {
    const host = getShakedexChannelHost(channel);
    await put(this.store, SHAKEDEX_CHANNEL_KEY, host);
    return host;
  };

  getShakedexChannel = async () => {
    return (
      (await get(this.store, SHAKEDEX_CHANNEL_KEY)) || DEFAULT_SHAKEDEX_CHANNEL
    );
  };

  setSecurityLockTimeout = async (minutes: number) => {
    const normalized = normalizeSecurityLockTimeout(minutes);
    await put(this.store, SECURITY_LOCK_TIMEOUT_KEY, normalized);
    return normalized;
  };

  getSecurityLockTimeout = async () => {
    const minutes = await get(this.store, SECURITY_LOCK_TIMEOUT_KEY);
    return normalizeSecurityLockTimeout(minutes);
  };

  async start() {
    this.store = bdb.create("/setting-store");
    await this.store.open();
    const {apiKey, apiHost} = await this.getAPI();
    this.apiKey = apiKey;
    this.apiHost = apiHost;
  }

  async stop() {}
}

export default SettingService;

function normalizeExplorer(explorer: Explorer) {
  return EXPLORERS.find((option) => option.id === explorer?.id) || EXPLORERS[0];
}

function normalizeSecurityLockTimeout(minutes: number) {
  const value = Number(minutes);
  if (!Number.isFinite(value)) return DEFAULT_SECURITY_LOCK_TIMEOUT;
  if (value === 0) return 0;
  return Math.min(Math.max(Math.round(value), 1), 1440);
}
