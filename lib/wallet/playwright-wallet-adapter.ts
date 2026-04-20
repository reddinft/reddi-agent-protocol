import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import {
  Connection,
  PublicKey,
  SendTransactionOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export const PLAYWRIGHT_WALLET_NAME = "Playwright Wallet" as WalletName<"Playwright Wallet">;
const PLAYWRIGHT_PUBLIC_KEY = new PublicKey(
  process.env.NEXT_PUBLIC_PLAYWRIGHT_WALLET_PUBLIC_KEY ?? "11111111111111111111111111111111"
);

export class PlaywrightWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = PLAYWRIGHT_WALLET_NAME;
  url = "https://agent-protocol.reddi.tech";
  icon =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='12' fill='%23111827'/%3E%3Cpath d='M18 46V18h14c8 0 14 6 14 14s-6 14-14 14H18zm8-8h6c3.3 0 6-2.7 6-6s-2.7-6-6-6h-6v12z' fill='%239945FF'/%3E%3C/svg%3E";

  readonly supportedTransactionVersions = new Set(["legacy", 0]);
  private _publicKey: PublicKey | null = null;
  private _connected = false;

  get publicKey() {
    return this._publicKey;
  }

  get connected() {
    return this._connected;
  }

  get readyState() {
    return WalletReadyState.Installed;
  }

  async connect(): Promise<void> {
    if (this._connected) return;
    this._publicKey = PLAYWRIGHT_PUBLIC_KEY;
    this._connected = true;
    this.emit("connect", this._publicKey);
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;
    this._connected = false;
    this._publicKey = null;
    this.emit("disconnect");
  }

  async sendTransaction(
    _transaction: Transaction | VersionedTransaction,
    _connection: Connection,
    _options?: SendTransactionOptions
  ): Promise<TransactionSignature> {
    return "playwright-mock-signature";
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    return transactions;
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    return message;
  }
}

