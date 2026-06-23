import MessageTypes from "@src/util/messageTypes";

(async function () {
  installLearnHNSMarketHandler();

  const url = chrome.runtime.getURL("js/shake.js");
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement("script");
  scriptTag.src = url;
  scriptTag.setAttribute("async", "false");
  container.insertBefore(scriptTag, container.children[0]);
  container.removeChild(scriptTag);

  window.addEventListener("message", async (event) => {
    const data = event.data;
    if (data && data.target === "shake-contentscript") {
      const res = await chrome.runtime.sendMessage(data.message);
      window.postMessage(
        {
          target: "shake-injectedscript",
          payload: res,
          nonce: data.nonce,
        },
        "*"
      );
    }
  });

  chrome.runtime.onMessage.addListener((action: any) => {
    switch (action.type) {
      case MessageTypes.DISCONNECTED:
        window.postMessage(
          {
            target: "shake-injectedscript",
            payload: [null, null],
            nonce: "disconnect",
          },
          "*"
        );
        return;
      case MessageTypes.NEW_BLOCK:
        window.postMessage(
          {
            target: "shake-injectedscript",
            payload: [null, action.payload],
            nonce: "newBlock",
          },
          "*"
        );
        return;
    }
  });
})();

function installLearnHNSMarketHandler() {
  if (!["market.learnhns.com", "127.0.0.1", "localhost"].includes(window.location.hostname)) {
    return;
  }

  window.addEventListener("click", async (event) => {
    const target = event.target as Element | null;
    const link = target?.closest?.("a[href^='bob://x/fulfillauction']");

    if (!link) {
      return;
    }

    if (link.hasAttribute("data-shake-wallet-ignore")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      const href = link.getAttribute("href") || "";
      const payload = parseFulfillAuctionLink(href);

      showLearnHNSToast("Opening LearnHNS Wallet confirmation...");

      const [err] = await chrome.runtime.sendMessage({
        type: MessageTypes.SEND_SHAKEDEX_FULFILL,
        payload: {
          ...payload,
          marketOrigin: window.location.origin,
        },
      });

      if (err) {
        throw new Error(err);
      }
    } catch (e: any) {
      showLearnHNSToast(e.message || "Could not open this LearnHNS buy link.", true);
    }
  }, true);
}

function parseFulfillAuctionLink(href: string) {
  const url = new URL(href);

  if (url.protocol !== "bob:" || url.pathname !== "/fulfillauction") {
    throw new Error("Unsupported Bob Wallet link.");
  }

  const proofParam = url.searchParams.get("presign");
  const name = url.searchParams.get("name");

  if (!proofParam) {
    throw new Error("Buy link is missing Shakedex proof data.");
  }

  const proof = JSON.parse(proofParam);

  if (name && proof.name && name.toLowerCase() !== String(proof.name).toLowerCase()) {
    throw new Error("Buy link name does not match proof data.");
  }

  return {proof};
}

function showLearnHNSToast(message: string, isError = false) {
  const id = "shake-learnhns-toast";
  const existing = document.getElementById(id);

  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.id = id;
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.left = "50%";
  toast.style.bottom = "24px";
  toast.style.transform = "translateX(-50%)";
  toast.style.zIndex = "2147483647";
  toast.style.maxWidth = "calc(100vw - 32px)";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "8px";
  toast.style.background = isError ? "#991b1b" : "#312e81";
  toast.style.color = "#fff";
  toast.style.font = "600 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  toast.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.28)";

  document.documentElement.appendChild(toast);
  window.setTimeout(() => toast.remove(), isError ? 6000 : 3000);
}
