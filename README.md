# LearnHNS Wallet

LearnHNS Wallet is a browser extension wallet for Handshake names and HNS. It is based on the original Shake Wallet codebase and keeps the legacy `window.shake` website API for compatibility with existing Handshake dapps.

## Features

- Create or restore a Handshake wallet.
- Send and receive HNS.
- View owned Handshake names.
- Register, update, and manage DNS records for owned names.
- Review dapp transaction requests in a browser popup.
- Fulfill compatible Shakedex / LearnHNS Market buy links.

## Build

```bash
npm install --legacy-peer-deps --ignore-scripts
npm run build
```

The Chrome extension package is built into:

```text
dist/
```

For Chrome Web Store upload, zip the contents of `dist` so `manifest.json` is at the root of the zip.

## Dapp Compatibility

The injected wallet object remains available at:

```js
window.shake
```

This name is intentionally preserved so sites already integrated with Shake Wallet can continue to connect to LearnHNS Wallet.
