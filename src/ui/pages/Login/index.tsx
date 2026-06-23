import React, { ReactElement, useCallback, useEffect, useState } from "react";
import WalletIcon from "../../../static/icons/learnhnsicon-dark-small.svg";
import "./login.scss";
import Icon from "@src/ui/components/Icon";
import Button from "@src/ui/components/Button";
import Input from "@src/ui/components/Input";
import {useDispatch} from "react-redux";
import {
  selectWallet,
  unlockWallet,
  useWallets,
  useWalletState,
} from "@src/ui/ducks/wallet";
import ErrorMessage from "@src/ui/components/ErrorMessage";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import classNames from "classnames";

type Props = {};

export default function Login(props: Props): ReactElement {
  const [visible, setVisibility] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectingWallet, setSelectingWallet] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();
  const wallets = useWallets();
  const {currentWallet} = useWalletState();

  useEffect(() => {
    postMessage({
      type: MessageTypes.MP_TRACK,
      payload: {
        name: "Screen View",
        data: {
          view: "Login",
        },
      },
    });
  }, []);

  const onUnlockWallet = useCallback(async () => {
    setLoading(true);

    try {
      await dispatch(unlockWallet(password));
    } catch (e) {
      setErrorMessage("Wrong password.");
    }

    setLoading(false);
  }, [password]);

  const onSelectWallet = useCallback(async (walletID: string) => {
    if (walletID === currentWallet || selectingWallet) return;

    setSelectingWallet(walletID);
    setErrorMessage("");
    setPassword("");

    try {
      await dispatch(selectWallet(walletID));
    } catch (e: any) {
      setErrorMessage(e.message || "Could not switch wallets.");
    }

    setSelectingWallet("");
  }, [currentWallet, selectingWallet]);

  return (
    <div className="login">
      <div className="login__content">
        <div>
          <Icon className="login__content__logo" url={WalletIcon} size={8} />
          <b>Welcome back to LearnHNS Wallet!</b>
          {wallets.length > 1 && (
            <div className="login__wallets">
              {wallets.map((wallet) => {
                const selected = wallet.wid === currentWallet;
                return (
                  <button
                    key={wallet.wid}
                    type="button"
                    className={classNames("login__wallets__item", {
                      "login__wallets__item--selected": selected,
                    })}
                    disabled={loading || !!selectingWallet}
                    onClick={() => onSelectWallet(wallet.wid)}
                  >
                    <span className="login__wallets__item__name">
                      {wallet.wid}
                    </span>
                    {wallet.watchOnly && (
                      <span className="login__wallets__item__pill">Ledger</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="login__footer">
        <Input
          label="Enter password"
          onChange={(e) => {
            setErrorMessage("");
            setPassword(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === "NumpadEnter") {
              onUnlockWallet();
            }
          }}
          value={password}
          type={visible ? "text" : "password"}
          fontAwesome={visible ? "fa-eye" : "fa-eye-slash"}
          onIconClick={() => setVisibility(!visible)}
        />
        <ErrorMessage>{errorMessage}</ErrorMessage>
        <Button onClick={onUnlockWallet} loading={loading} disabled={loading}>
          Unlock Wallet
        </Button>
      </div>
    </div>
  );
}
