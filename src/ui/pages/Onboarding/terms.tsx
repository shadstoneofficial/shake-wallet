import React, {ReactElement} from "react";

export default function TermsOfUse(): ReactElement {
  return (
    <div className="terms__contentbox">
      <p><strong>LEARNHNS WALLET</strong></p>
      <p><strong>TERMS OF USE</strong></p>
      <p><em>Draft marketplace submission terms. Replace with counsel-approved terms before public launch.</em></p>

      <p>
        LearnHNS Wallet is a self-custody browser wallet for the Handshake
        network. It lets you create or restore a wallet, hold HNS, manage
        Handshake names and DNS records, and review transactions requested by
        compatible websites.
      </p>

      <p>
        You are responsible for your wallet, seed phrase, password, device, and
        any transactions you approve. LearnHNS Wallet cannot recover your seed
        phrase, reverse blockchain transactions, or access your HNS on your
        behalf.
      </p>

      <p>
        Handshake transactions are broadcast to a decentralized network and may
        be delayed, rejected, reorganized, or fail for reasons outside the
        wallet's control. You should carefully review every confirmation screen
        before signing or broadcasting.
      </p>

      <p>
        The wallet stores wallet data locally in your browser extension storage.
        It may connect to Handshake nodes, explorers, or compatible websites
        when you choose to use those features. Do not use this wallet with funds
        or names you are not prepared to manage yourself.
      </p>

      <p>
        Wallet rescans may send derived receive and change addresses from your
        wallet to the configured RPC or indexer service so the wallet can
        discover relevant transactions, balances, and name ownership. The
        default service may therefore see addresses associated with your wallet.
        LearnHNS Wallet does not send your seed phrase or private keys. If you
        prefer not to use the default hosted service, configure your own
        compatible Handshake RPC or indexer endpoint before importing or
        restoring a wallet.
      </p>

      <p>
        This software is provided as-is, without warranties. By continuing, you
        acknowledge the risks of self-custody cryptocurrency software and agree
        to use LearnHNS Wallet only where lawful for you to do so.
      </p>
    </div>
  );
}
