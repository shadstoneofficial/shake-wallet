import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import classNames from "classnames";
import Button, {ButtonType} from "@src/ui/components/Button";
import Icon from "@src/ui/components/Icon";
import {Loader} from "@src/ui/components/Loader";
import Select from "@src/ui/components/Select";
import {useHistory} from "react-router";
import postMessage from "@src/util/postMessage";
import MessageTypes from "@src/util/messageTypes";
import {formatNumber, fromDollaryDoos} from "@src/util/number";
import {
  DEFAULT_SHAKEDEX_MARKET_ORIGIN,
  normalizeShakedexMarketOrigin,
} from "@src/util/marketplace";
import "./marketplace.scss";
const punycode = require("punycode/");

type ShakedexBid = {
  price: number;
  lockTime: number;
  signature: string;
  fee?: number;
};

type MarketplaceListing = {
  id: string | number;
  name: string;
  lockingTxHash: string;
  lockingOutputIdx: number;
  publicKey: string;
  paymentAddr: string;
  feeAddr?: string;
  version?: number;
  bids?: ShakedexBid[];
  data?: ShakedexBid[];
  pending?: boolean;
  buyable?: boolean;
  expectedPrice?: number;
  pendingReason?: string;
  status?: string;
  expiresAt?: string | null;
  url?: string;
};

type MarketplaceFilter = "all" | "active" | "pending";
type ListingStatus =
  | "active"
  | "pending"
  | "waiting"
  | "expired"
  | "unavailable";

export default function Marketplace(): ReactElement {
  const history = useHistory();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [marketOrigin, setMarketOrigin] = useState(
    DEFAULT_SHAKEDEX_MARKET_ORIGIN
  );
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");

  const fetchListings = useCallback(
    async (quiet = false) => {
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const auctions = await fetchAllListings(marketOrigin);
        setListings(auctions);
      } catch (e: any) {
        setError(e?.message || "Could not load marketplace listings.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [marketOrigin]
  );

  useEffect(() => {
    (async function loadMarketplaceSettings() {
      try {
        const channel = (await postMessage({
          type: MessageTypes.GET_SHAKEDEX_CHANNEL,
        })) as string;
        setMarketOrigin(normalizeShakedexMarketOrigin(channel));
      } catch (e) {
        setMarketOrigin(DEFAULT_SHAKEDEX_MARKET_ORIGIN);
      }
    })();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const visibleListings = useMemo(() => {
    return listings
      .filter((listing) => {
        if (filter === "active") return isActiveListing(listing);
        if (filter === "pending") return isPendingListing(listing);
        return isActiveListing(listing) || isPendingListing(listing);
      })
      .sort((a, b) => {
        if (isPendingListing(a) !== isPendingListing(b)) {
          return isPendingListing(a) ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [listings, filter]);

  const onBuy = useCallback(
    async (listing: MarketplaceListing) => {
      setBuyingId(listing.id);
      setMessage("");
      setError("");

      try {
        await postMessage({
          type: MessageTypes.SEND_SHAKEDEX_FULFILL,
          payload: {
            proof: listingToProof(listing),
            marketOrigin,
          },
        });
        setMessage(`${listing.name} purchase transaction was accepted.`);
        fetchListings(true);
      } catch (e: any) {
        setError(e?.message || "Could not open the purchase confirmation.");
      } finally {
        setBuyingId(null);
      }
    },
    [fetchListings, marketOrigin]
  );

  return (
    <div className="marketplace">
      <div className="marketplace__toolbar">
        <div className="marketplace__toolbar__meta">
          {loading
            ? "Loading listings"
            : listingCountText(visibleListings, filter)}
        </div>
        <div className="marketplace__toolbar__actions">
          <Button
            btnType={ButtonType.secondary}
            tiny
            onClick={() => history.push("/marketplace/sell")}
          >
            Sell
          </Button>
          <Select
            className="marketplace__filter"
            aria-label="Marketplace listing filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as MarketplaceFilter)}
            options={[
              {value: "all", children: "All"},
              {value: "active", children: "Active"},
              {value: "pending", children: "Pending"},
            ]}
          />
          <Button
            btnType={ButtonType.secondary}
            tiny
            loading={refreshing}
            onClick={() => fetchListings(true)}
            title="Refresh listings"
          >
            <Icon fontAwesome="fa-sync-alt" size={0.75} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="marketplace__notice marketplace__notice--error">
          {error}
        </div>
      )}
      {message && (
        <div className="marketplace__notice marketplace__notice--success">
          {message}
        </div>
      )}

      {loading && <Loader size={3} />}

      {!loading && !visibleListings.length && !error && (
        <div className="marketplace__empty">
          <div>{emptyText(filter)}</div>
          <small>{emptyDetail(filter)}</small>
        </div>
      )}

      {!loading &&
        visibleListings.map((listing) => (
          <MarketplaceRow
            key={listing.id}
            listing={listing}
            marketOrigin={marketOrigin}
            buying={buyingId === listing.id}
            onBuy={onBuy}
          />
        ))}
    </div>
  );
}

function MarketplaceRow(props: {
  listing: MarketplaceListing;
  marketOrigin: string;
  buying: boolean;
  onBuy: (listing: MarketplaceListing) => void;
}): ReactElement {
  const {listing, marketOrigin, buying, onBuy} = props;
  const currentBid = getCurrentBid(listing);
  const status = getListingStatus(listing, currentBid);
  const buyDisabled = buying || status !== "active" || !currentBid;
  const price = currentBid || getLowestBid(listing);
  const expectedPrice = getExpectedPrice(listing);
  const marketUrl = `${marketOrigin}${
    listing.url || `/listing/${listing.name}`
  }`;

  const openMarketListing = useCallback(
    (e) => {
      e.stopPropagation();
      window.open(marketUrl, "_blank");
    },
    [marketUrl]
  );

  const onBuyClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!buyDisabled) {
        onBuy(listing);
      }
    },
    [buyDisabled, listing, onBuy]
  );

  return (
    <div className="marketplace-listing" onClick={openMarketListing}>
      <div className="marketplace-listing__icon">
        <Icon fontAwesome="fa-store" size={0.9} />
      </div>
      <div className="marketplace-listing__body">
        <div className="marketplace-listing__body__name">
          <span>{listing.name}</span>
          {getUnicodeName(listing.name) && (
            <span className="marketplace-listing__body__name__unicode">
              {getUnicodeName(listing.name)}
            </span>
          )}
        </div>
        <div className="marketplace-listing__body__status">
          <span
            className={classNames(
              "marketplace-listing__body__status__pill",
              `marketplace-listing__body__status__pill--${status}`
            )}
          >
            {statusToText(status)}
          </span>
          <button
            className="marketplace-listing__body__status__link"
            type="button"
            onClick={openMarketListing}
          >
            View
          </button>
        </div>
      </div>
      <div className="marketplace-listing__trade">
        <div className="marketplace-listing__trade__price">
          {price
            ? `${formatNumber(fromDollaryDoos(price.price))} HNS`
            : expectedPrice
            ? `${formatNumber(fromDollaryDoos(expectedPrice))} HNS`
            : "Price soon"}
        </div>
        {status === "pending" ? (
          <div className="marketplace-listing__trade__pending">Coming soon</div>
        ) : (
          <Button
            className="marketplace-listing__trade__buy"
            tiny
            loading={buying}
            disabled={buyDisabled}
            onClick={onBuyClick}
          >
            Buy
          </Button>
        )}
      </div>
    </div>
  );
}

function getListingBids(listing: MarketplaceListing): ShakedexBid[] {
  if (Array.isArray(listing.data)) return listing.data;
  if (Array.isArray(listing.bids)) return listing.bids;
  return [];
}

function getCurrentBid(listing: MarketplaceListing): ShakedexBid | null {
  if (isExpired(listing)) return null;

  const now = Math.floor(Date.now() / 1000);
  const matureBids = getListingBids(listing)
    .filter((bid) => typeof bid.price === "number" && bid.lockTime <= now)
    .sort((a, b) => a.price - b.price);

  return matureBids[0] || null;
}

function getLowestBid(listing: MarketplaceListing): ShakedexBid | null {
  const bids = getListingBids(listing)
    .filter((bid) => typeof bid.price === "number")
    .sort((a, b) => a.price - b.price);

  return bids[0] || null;
}

function getListingStatus(
  listing: MarketplaceListing,
  currentBid: ShakedexBid | null
): ListingStatus {
  if (isPendingListing(listing)) return "pending";
  if (isExpired(listing)) return "expired";
  if (currentBid) return "active";
  if (getListingBids(listing).length) return "waiting";
  return "unavailable";
}

function isPendingListing(listing: MarketplaceListing): boolean {
  return !!listing.pending;
}

function isActiveListing(listing: MarketplaceListing): boolean {
  return !isPendingListing(listing) && getListingBids(listing).length > 0;
}

function getExpectedPrice(listing: MarketplaceListing): number | null {
  return typeof listing.expectedPrice === "number" && listing.expectedPrice > 0
    ? listing.expectedPrice
    : null;
}

function isExpired(listing: MarketplaceListing): boolean {
  if (!listing.expiresAt) return false;
  const expiresAt = parseMarketDate(listing.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

async function fetchAllListings(
  marketOrigin: string
): Promise<MarketplaceListing[]> {
  const perPage = 100;
  const listings: MarketplaceListing[] = [];
  let page = 1;
  let total = 0;

  do {
    const res = await fetch(
      `${marketOrigin}/api/v2/auctions?per_page=${perPage}&page=${page}`
    );
    if (!res.ok) {
      throw new Error("Could not load marketplace listings.");
    }

    const payload = await res.json();
    const auctions = Array.isArray(payload?.auctions) ? payload.auctions : [];
    listings.push(...auctions);
    total = Number(payload?.total || listings.length);
    page += 1;
  } while (listings.length < total);

  return listings;
}

function getUnicodeName(name: string): string {
  if (!name.startsWith("xn--")) return "";

  try {
    const decoded = punycode.toUnicode(name);
    return decoded !== name ? decoded : "";
  } catch (e) {
    return "";
  }
}

function parseMarketDate(value: string): number {
  const hasTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value);
  return Date.parse(hasTimezone ? value : `${value}Z`);
}

function statusToText(status: ListingStatus): string {
  return {
    active: "Active",
    pending: "Pending",
    waiting: "Waiting",
    expired: "Expired",
    unavailable: "Unavailable",
  }[status];
}

function listingCountText(
  listings: MarketplaceListing[],
  filter: MarketplaceFilter
): string {
  const noun = listings.length === 1 ? "listing" : "listings";
  if (filter === "active") return `${listings.length} active ${noun}`;
  if (filter === "pending") return `${listings.length} pending ${noun}`;
  return `${listings.length} marketplace ${noun}`;
}

function emptyText(filter: MarketplaceFilter): string {
  if (filter === "pending") return "No pending listings found";
  if (filter === "all") return "No marketplace listings found";
  return "No active listings found";
}

function emptyDetail(filter: MarketplaceFilter): string {
  if (filter === "active") {
    return "Pending seller listings will become active after their Shakedex proof is live.";
  }
  if (filter === "pending") {
    return "New seller listings will appear here while their transfer lockup matures.";
  }
  return "Active and pending LearnHNS Market listings will appear here.";
}

function listingToProof(listing: MarketplaceListing) {
  return {
    version: listing.version || 2,
    name: listing.name,
    lockingTxHash: listing.lockingTxHash,
    lockingOutputIdx: listing.lockingOutputIdx,
    publicKey: listing.publicKey,
    paymentAddr: listing.paymentAddr,
    feeAddr: listing.feeAddr,
    data: getListingBids(listing),
    expiresAt: listing.expiresAt,
  };
}
