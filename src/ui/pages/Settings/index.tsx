import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  RegularView,
  RegularViewContent,
  RegularViewHeader,
} from "@src/ui/components/RegularView";
import {Route, Switch, useHistory} from "react-router";
import {useDispatch} from "react-redux";
import Icon from "@src/ui/components/Icon";
import "./settings.scss";
import Input from "@src/ui/components/Input";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import Button, {ButtonProps, ButtonType} from "@src/ui/components/Button";
import {selectAccount, useWalletState} from "@src/ui/ducks/wallet";
import {
  setMultiAccountsEnabled,
  useMultiAccountsEnabled,
} from "@src/ui/ducks/app";
import Modal from "@src/ui/components/Modal";
import Textarea from "@src/ui/components/Textarea";
import SwitchButton from "@src/ui/components/SwitchButton";
import Select from "@src/ui/components/Select";
import {EXPLORERS} from "@src/util/explorer";
import {useExplorer, setExplorer} from "@src/ui/ducks/app";
import {DEFAULT_SHAKEDEX_CHANNEL} from "@src/util/marketplace";
import TermsOfUse from "@src/ui/pages/Onboarding/terms";

const pkg = require("../../../../package.json");

export default function Settings(): ReactElement {
  const history = useHistory();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Settings",
        },
      },
    });
  }, []);

  return (
    <RegularView className="settings">
      <Switch>
        <Route path="/settings/general">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">General</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/network">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Network</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/marketplace">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Marketplace</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/wallet">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Wallet</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/security">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">Security</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/about/terms">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.push("/settings/about")}
            />
            <div className="settings__title">Terms</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings/about">
          <RegularViewHeader onClose={() => history.push("/")}>
            <Icon
              size={1.25}
              fontAwesome="fa-arrow-left"
              onClick={() => history.goBack()}
            />
            <div className="settings__title">About</div>
          </RegularViewHeader>
        </Route>
        <Route path="/settings">
          <RegularViewHeader onClose={() => history.push("/")}>
            Settings
          </RegularViewHeader>
        </Route>
      </Switch>
      <RegularViewContent>
        <Switch>
          <Route path="/settings/general">
            <GeneralContent />
          </Route>
          <Route path="/settings/network">
            <NetworkContent />
          </Route>
          <Route path="/settings/marketplace">
            <MarketplaceContent />
          </Route>
          <Route path="/settings/wallet">
            <WalletContent />
          </Route>
          <Route path="/settings/security">
            <SecurityContent />
          </Route>
          <Route path="/settings/about/terms">
            <TermsContent />
          </Route>
          <Route path="/settings/about">
            <AboutContent />
          </Route>
          <Route path="/settings">
            <SettingsSelectContent />
          </Route>
        </Switch>
      </RegularViewContent>
    </RegularView>
  );
}

function GeneralContent(): ReactElement {
  const explorer = useExplorer();
  const multiAccountsEnabled = useMultiAccountsEnabled();
  const dispatch = useDispatch();

  const explorerOptions = EXPLORERS.map((explorerOption) => ({
    value: explorerOption.id,
    children: explorerOption.label,
  }));
  if (explorer && !EXPLORERS.find((e) => e.id === explorer.id)) {
    explorerOptions.push({
      value: "custom",
      children: "Custom",
    });
  }

  const onExplorerChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      if (newId === "custom") return;
      const newExplorer = EXPLORERS.find((e) => e.id === newId) || EXPLORERS[0];
      await postMessage({
        type: MessageTypes.SET_EXPLORER,
        payload: newExplorer,
      });
      dispatch(setExplorer(newExplorer));
    },
    [dispatch]
  );

  const updateMultiAccountsEnabled = useCallback(
    async (e) => {
      const checked = e.target.checked;
      // persist setting
      await postMessage({
        type: MessageTypes.SET_MULTI_ACCOUNTS_ENABLED,
        payload: checked,
      });
      // update UI
      dispatch(setMultiAccountsEnabled(checked));
      if (!checked) {
        dispatch(selectAccount("default"));
      }
    },
    [dispatch]
  );

  return (
    <>
      <SettingGroup
        name="Block Explorer"
        selectProps={{
          value: explorer.id,
          onChange: onExplorerChange,
          options: explorerOptions,
        }}
      >
        <small>
          Select the block explorer to open names, transactions, addresses, and
          blocks.
        </small>
      </SettingGroup>
      <SettingGroup
        name="Enable Multi-Accounts"
        switchBtnProps={{
          update: updateMultiAccountsEnabled,
          active: multiAccountsEnabled,
        }}
      >
        <small>
          <b>Warning: </b>Any transactions made from non-default accounts will
          not be visible in Bob Desktop as it does not support multi-accounts
          yet.
        </small>
      </SettingGroup>
    </>
  );
}

function NetworkContent(): ReactElement {
  const [rpcUrl, setRPCUrl] = useState("");
  const [defaultRpcUrl, setDefaultRPCUrl] = useState("");
  const [rpcAPIKey, setAPIKey] = useState("");
  const [defaultRpcAPIKey, setDefaultAPIKey] = useState("");
  const [rpcURLError, setRPCUrlError] = useState("");
  const [rpcAPIKeyError, setRPCApiKeyError] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [savingAPIKey, setSavingApiKey] = useState(false);

  useEffect(() => {
    (async function onNetworkContentMount() {
      const {apiHost, apiKey} = await postMessage({
        type: MessageTypes.GET_API,
      });
      setDefaultRPCUrl(apiHost);
      setRPCUrl(apiHost);
      setAPIKey(apiKey);
      setDefaultAPIKey(apiKey);
    })();
  }, []);

  const onSaveURL = useCallback(async () => {
    setSavingUrl(true);
    try {
      await postMessage({
        type: MessageTypes.SET_RPC_HOST,
        payload: rpcUrl,
      });
      setDefaultRPCUrl(rpcUrl);
    } catch (e: any) {
      setRPCUrlError(e.message);
    }
    setSavingUrl(false);
  }, [rpcUrl]);

  const onSaveAPIKey = useCallback(async () => {
    setSavingApiKey(true);
    try {
      await postMessage({
        type: MessageTypes.SET_RPC_KEY,
        payload: rpcAPIKey,
      });
      setDefaultAPIKey(rpcAPIKey);
    } catch (e: any) {
      setRPCApiKeyError(e.message);
    }
    setSavingApiKey(false);
  }, [rpcAPIKey]);

  return (
    <>
      <SettingGroup
        name="RPC URL"
        primaryBtnProps={{
          children: "Save",
          onClick: onSaveURL,
          disabled: defaultRpcUrl === rpcUrl || savingUrl,
          loading: savingUrl,
        }}
      >
        <Input
          value={rpcUrl}
          errorMessage={rpcURLError}
          onChange={(e) => setRPCUrl(e.target.value)}
        />
      </SettingGroup>
      <SettingGroup
        name="RPC API Key"
        primaryBtnProps={{
          children: "Save",
          onClick: onSaveAPIKey,
          disabled: defaultRpcAPIKey === rpcAPIKey || savingAPIKey,
          loading: savingAPIKey,
        }}
      >
        <Input
          value={rpcAPIKey}
          errorMessage={rpcAPIKeyError}
          onChange={(e) => setAPIKey(e.target.value)}
        />
      </SettingGroup>
    </>
  );
}

function MarketplaceContent(): ReactElement {
  const [channel, setChannel] = useState(DEFAULT_SHAKEDEX_CHANNEL);
  const [savedChannel, setSavedChannel] = useState(DEFAULT_SHAKEDEX_CHANNEL);
  const [channelError, setChannelError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async function onMarketplaceContentMount() {
      const currentChannel = await postMessage({
        type: MessageTypes.GET_SHAKEDEX_CHANNEL,
      });
      setChannel(currentChannel as string);
      setSavedChannel(currentChannel as string);
    })();
  }, []);

  const onSaveChannel = useCallback(async () => {
    setSaving(true);
    setChannelError("");
    try {
      const saved = await postMessage({
        type: MessageTypes.SET_SHAKEDEX_CHANNEL,
        payload: channel,
      });
      setChannel(saved as string);
      setSavedChannel(saved as string);
    } catch (e: any) {
      setChannelError(e.message || "Could not save marketplace channel.");
    }
    setSaving(false);
  }, [channel]);

  const onResetChannel = useCallback(() => {
    setChannel(DEFAULT_SHAKEDEX_CHANNEL);
    setChannelError("");
  }, []);

  return (
    <>
      <SettingGroup
        name="Shakedex Channel"
        primaryBtnProps={{
          children: "Save",
          onClick: onSaveChannel,
          disabled: savedChannel === channel || saving,
          loading: saving,
        }}
        secondaryBtnProps={{
          children: "Reset",
          onClick: onResetChannel,
          disabled: channel === DEFAULT_SHAKEDEX_CHANNEL || saving,
        }}
      >
        <Input
          value={channel}
          errorMessage={channelError}
          onChange={(e) => setChannel(e.target.value)}
          placeholder={DEFAULT_SHAKEDEX_CHANNEL}
        />
        <small>
          Choose the LearnHNS-compatible marketplace used for browsing listings,
          proof downloads, and Shakedex coin lookup.
        </small>
      </SettingGroup>
    </>
  );
}

function WalletContent(): ReactElement {
  const {rescanning} = useWalletState();

  const rescan = useCallback(() => {
    if (rescanning) return;

    postMessage({
      type: MessageTypes.FULL_RESCAN,
    });
  }, [rescanning]);

  const stopRescan = useCallback(() => {
    if (!rescanning) return;

    postMessage({
      type: MessageTypes.STOP_RESCAN,
    });
  }, [rescanning]);

  return (
    <>
      <SettingGroup
        name="Rescan"
        primaryBtnProps={{
          children: rescanning ? "Stop Rescan" : "Rescan",
          onClick: rescanning ? stopRescan : rescan,
          // loading: rescanning,
        }}
      >
        <small>Perform a full rescan.</small>
      </SettingGroup>
    </>
  );
}

function SecurityContent(): ReactElement {
  const [isShowingRevealModal, setShowingRevealModal] = useState(false);
  const [password, setPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [optInAnalytics, setOptInAnalytics] = useState(false);
  const [lockTimeout, setLockTimeout] = useState("15");

  useEffect(() => {
    (async function () {
      const [optIn, timeout] = await Promise.all([
        postMessage({
          type: MessageTypes.GET_ANALYTICS,
        }),
        postMessage({
          type: MessageTypes.GET_SECURITY_LOCK_TIMEOUT,
        }),
      ]);
      setOptInAnalytics(optIn);
      setLockTimeout(String(timeout ?? 15));
    })();
  }, []);

  const updateAnalytics = useCallback(
    async (e) => {
      await postMessage({
        type: MessageTypes.SET_ANALYTICS,
        payload: e.target.checked,
      });
      const optIn = await postMessage({
        type: MessageTypes.GET_ANALYTICS,
      });
      setOptInAnalytics(optIn);
    },
    [optInAnalytics]
  );

  const revealSeed = useCallback(async () => {
    try {
      const mnemonic = await postMessage({
        type: MessageTypes.REVEAL_SEED,
        payload: password,
      });
      setMnemonic(mnemonic);
      setRevealError("");
    } catch (e: any) {
      setRevealError(e.message);
    }
  }, [password]);

  const closeRevealModal = useCallback(() => {
    setMnemonic("");
    setPassword("");
    setRevealError("");
    setShowingRevealModal(false);
  }, []);

  const updateLockTimeout = useCallback(async (e) => {
    const value = e.target.value;
    const timeout = await postMessage({
      type: MessageTypes.SET_SECURITY_LOCK_TIMEOUT,
      payload: Number(value),
    });
    setLockTimeout(String(timeout));
  }, []);

  return (
    <>
      {isShowingRevealModal && (
        <Modal className="confirm-modal reveal-seed" onClose={closeRevealModal}>
          {mnemonic ? (
            <>
              <p>Reveal your seed phrase</p>
              <small>
                You need this to restore your wallet if use change browser or
                computer.
              </small>
              <Textarea value={mnemonic} />
              <Button
                className="reveal-seed__confirm-button"
                onClick={closeRevealModal}
                small
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <p>Reveal your seed phrase</p>
              <small>
                You need this to restore your wallet if use change browser or
                computer.
              </small>
              <Input
                type="password"
                className="reveal-seed__password-input"
                label="Enter password to continue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {revealError && (
                <small className="error-message">{revealError}</small>
              )}
              <Button
                className="reveal-seed__confirm-button"
                disabled={!password}
                onClick={revealSeed}
                small
              >
                Reveal Seedphrase
              </Button>
            </>
          )}
        </Modal>
      )}
      <SettingGroup
        name="Auto-Lock Timer"
        selectProps={{
          value: lockTimeout,
          onChange: updateLockTimeout,
          options: [
            {value: "1", children: "1 minute"},
            {value: "15", children: "15 minutes"},
            {value: "60", children: "1 hour"},
            {value: "240", children: "4 hours"},
            {value: "0", children: "Never during browser session"},
          ],
        }}
      >
        <small>
          Keep the wallet unlocked while you are active, then lock it after this
          period. The unlocked session is kept in memory and may reset when the
          extension background service restarts.
        </small>
      </SettingGroup>
      <SettingGroup
        name="Reveal Seedphrase"
        primaryBtnProps={{
          children: "Reveal",
          onClick: () => setShowingRevealModal(true),
        }}
      >
        <small>Reveal wallet seed phrase.</small>
      </SettingGroup>
      {/* <SettingGroup
        name="Analytics Opt-in"
        switchBtnProps={{
          update: updateAnalytics,
          active: optInAnalytics,
        }}
      >
        <small>Send analytics to help improve LearnHNS Wallet.</small>
      </SettingGroup> */}
    </>
  );
}

function AboutContent(): ReactElement {
  const history = useHistory();
  const openLearnHNS = useCallback(() => {
    window.open("https://learnhns.com/", "_blank");
  }, []);

  return (
    <>
      <SettingGroup name="LearnHNS Wallet">
        <small>
          A Chrome extension wallet for Handshake names, HNS, DNS records, and
          LearnHNS Market confirmations.
        </small>
      </SettingGroup>
      <SettingGroup name="Version">
        <strong>{pkg.version}</strong>
      </SettingGroup>
      <SettingGroup
        name="Terms of Use"
        primaryBtnProps={{
          children: "View",
          onClick: () => history.push("/settings/about/terms"),
        }}
      >
        <small>
          Review LearnHNS Wallet terms, including wallet rescan and address
          lookup disclosures.
        </small>
      </SettingGroup>
      <SettingGroup
        name="Website"
        primaryBtnProps={{
          children: "Open",
          onClick: openLearnHNS,
        }}
      >
        <a
          className="settings__link"
          href="https://learnhns.com/"
          target="_blank"
          rel="noreferrer"
        >
          learnhns.com
        </a>
      </SettingGroup>
    </>
  );
}

function TermsContent(): ReactElement {
  return (
    <div className="settings__terms">
      <TermsOfUse />
    </div>
  );
}

function SettingsSelectContent(): ReactElement {
  const history = useHistory();

  return (
    <>
      <SettingSelectGroup
        name="General"
        description="Explorer selection and features"
        onClick={() => history.push("/settings/general")}
      />
      <SettingSelectGroup
        name="Network"
        description="Edit RPC network"
        onClick={() => history.push("/settings/network")}
      />
      <SettingSelectGroup
        name="Marketplace"
        description="Choose Shakedex marketplace channel"
        onClick={() => history.push("/settings/marketplace")}
      />
      <SettingSelectGroup
        name="Wallet"
        description="Rescan, backup, seed phrase"
        onClick={() => history.push("/settings/wallet")}
      />
      <SettingSelectGroup
        name="Security &amp; Privacy"
        description="Privacy settings and wallet seed phrase"
        onClick={() => history.push("/settings/security")}
      />
      <SettingSelectGroup
        name="About"
        description="Version and general info"
        onClick={() => history.push("/settings/about")}
      />
    </>
  );
}

type SelectGroupProps = {
  name: string;
  description: string;
  onClick: () => void;
  hover?: boolean;
};

function SettingSelectGroup(props: SelectGroupProps) {
  return (
    <div
      className="setting-group  setting-group--clickable"
      onClick={props.onClick}
    >
      <div className="setting-group__l">
        <div className="setting-group__title">{props.name}</div>
        <div className="setting-group__description">{props.description}</div>
      </div>
      <Icon fontAwesome="fa-chevron-right" size={1} />
    </div>
  );
}

type GroupProps = {
  name: string;
  children: ReactNode;
  primaryBtnProps?: ButtonProps;
  secondaryBtnProps?: ButtonProps;
  switchBtnProps?: {
    update: (e: any) => Promise<void>;
    active: boolean;
  };
  selectProps?: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Array<{value: string; children: string}>;
  };
};

function SettingGroup(props: GroupProps) {
  return (
    <div className="setting-group">
      <div className="setting-group__l">
        <div className="setting-group__title">{props.name}</div>
        <div className="setting-group__row">
          <div className="setting-group__children">{props.children}</div>
          <div className="setting-group__actions">
            {props.switchBtnProps && (
              <SwitchButton
                className="setting-group__toggle"
                onChange={props.switchBtnProps.update}
                checked={props.switchBtnProps.active}
              />
            )}
            {props.secondaryBtnProps && (
              <Button
                btnType={ButtonType.secondary}
                {...props.secondaryBtnProps}
              >
                {props.secondaryBtnProps.children}
              </Button>
            )}
            {props.primaryBtnProps && (
              <Button btnType={ButtonType.primary} {...props.primaryBtnProps}>
                {props.primaryBtnProps.children}
              </Button>
            )}
            {props.selectProps && (
              <Select
                value={props.selectProps.value}
                onChange={props.selectProps.onChange}
                options={props.selectProps.options}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
