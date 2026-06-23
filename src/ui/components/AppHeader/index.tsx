import React, {ReactElement, useCallback} from "react";
import ReactTooltip from "react-tooltip";
import WalletIcon from "../../../static/icons/learnhnsicon-dark-small.svg";
import WalletMoveIcon from "../../../static/icons/learnhns-animated.svg";
import "./app-header.scss";
import Icon from "@src/ui/components/Icon";
import WalletMenu from "@src/ui/components/WalletMenu";
import {useShakeMessage, useShakeMoving} from "@src/ui/ducks/app";
import classNames from "classnames";
import {useWalletState} from "@src/ui/ducks/wallet";
import {useCurrentBlockHeight} from "@src/ui/ducks/node";
import {getExplorerUrl} from "@src/util/explorer";
import {useExplorer} from "@src/ui/ducks/app";
import {useHistory} from "react-router";

export default function AppHeader(): ReactElement {
  const {rescanning} = useWalletState();
  const shakeMessage = useShakeMessage();
  const shakeMoving = useShakeMoving();
  const currentBlockHeight = useCurrentBlockHeight();
  const explorer = useExplorer();
  const history = useHistory();

  const handleBlockClick = useCallback(() => {
    window.open(
      getExplorerUrl(explorer, "block", String(currentBlockHeight)),
      "_blank"
    );
  }, [explorer, currentBlockHeight]);

  return (
    <>
      <div className="app-header">
        <div className="app-header__l">
          <div data-for="shake-message" data-tip>
            <Icon
              className={classNames("app-header__shake-icon", {
                "app-header__shake-icon--moving": rescanning || shakeMoving,
              })}
              url={WalletIcon}
              size={2.5}
            />
            <Icon
              className={classNames("app-header__shake-move-icon", {
                "app-header__shake-move-icon--moving": rescanning || shakeMoving,
              })}
              url={WalletMoveIcon}
              size={2.625}
            />
          </div>
        </div>
        <div className="app-header__m">
          <div
            className="app-header__block-height"
            onClick={handleBlockClick}
          >
            <div className="app-header__block-height__label">
              Current Block:
            </div>
            <div className="app-header__block-height__value">
              {currentBlockHeight}
            </div>
          </div>
        </div>
        <div className="app-header__r">
          <button
            className="app-header__settings-button"
            type="button"
            title="Settings"
            aria-label="Settings"
            data-for="settings-tip"
            data-tip
            onClick={() => history.push("/settings")}
          >
            <Icon fontAwesome="fa-cog" size={1.1} />
          </button>
          <WalletMenu />
        </div>
      </div>
      <ReactTooltip
        id="shake-message"
        place="bottom"
        type="light"
        getContent={() => shakeMessage || "Welcome back!"}
      />
      <ReactTooltip
        id="settings-tip"
        place="bottom"
        type="light"
        getContent={() => "Settings"}
      />
    </>
  );
}
