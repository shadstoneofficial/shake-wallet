import React, {ReactElement, useCallback} from "react";
import {
  RegularView,
  RegularViewContent,
  RegularViewFooter,
  RegularViewHeader,
} from "@src/ui/components/RegularView";
import Button, {ButtonType} from "@src/ui/components/Button";
import Icon from "@src/ui/components/Icon";
import {useHistory} from "react-router";
import "./sell-listing.scss";

const BOB_DOWNLOAD_URL = "https://bobwallet.org/download";

export default function SellListing(): ReactElement {
  const history = useHistory();

  const openBobDownload = useCallback(() => {
    window.open(BOB_DOWNLOAD_URL, "_blank");
  }, []);

  return (
    <RegularView className="sell-listing">
      <RegularViewHeader onClose={() => history.push("/")}>
        <Icon
          size={1.25}
          fontAwesome="fa-arrow-left"
          onClick={() => history.goBack()}
        />
        <div>Sell a Name</div>
      </RegularViewHeader>
      <RegularViewContent>
        <div className="sell-listing__panel">
          <div className="sell-listing__icon">
            <Icon fontAwesome="fa-store" size={1.6} />
          </div>
          <h2>In-extension selling is in development</h2>
          <p>
            LearnHNS Wallet can browse and buy Shakedex listings today. Creating
            a seller listing from the Chrome extension needs a careful custody
            flow, so we are keeping it disabled while we finish and test it.
          </p>
          <p>
            To create a Shakedex listing now, use Bob LearnHNS Desktop, which
            already supports the seller workflow.
          </p>
        </div>
      </RegularViewContent>
      <RegularViewFooter>
        <Button
          btnType={ButtonType.secondary}
          onClick={() => history.push("/")}
        >
          Back
        </Button>
        <Button onClick={openBobDownload}>Download Bob</Button>
      </RegularViewFooter>
    </RegularView>
  );
}
