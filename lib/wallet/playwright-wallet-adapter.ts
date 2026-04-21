import {
  BaseMessageSignerWalletAdapter,
  WalletName,
  WalletReadyState,
} from "@solana/wallet-adapter-base";
import {
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export const PLAYWRIGHT_WALLET_NAME = "Playwright Wallet" as WalletName<"Playwright Wallet">;

function loadPlaywrightSigner(): Keypair | null {
  const raw = process.env.NEXT_PUBLIC_PLAYWRIGHT_WALLET_SECRET_KEY;
  if (!raw) return null;
  try {
    const bytes = JSON.parse(raw) as number[];
    if (!Array.isArray(bytes) || bytes.length === 0) return null;
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  } catch {
    return null;
  }
}

const PLAYWRIGHT_SIGNER = loadPlaywrightSigner();
const PLAYWRIGHT_PUBLIC_KEY = PLAYWRIGHT_SIGNER
  ? PLAYWRIGHT_SIGNER.publicKey
  : new PublicKey(process.env.NEXT_PUBLIC_PLAYWRIGHT_WALLET_PUBLIC_KEY ?? "11111111111111111111111111111111");

export class PlaywrightWalletAdapter extends BaseMessageSignerWalletAdapter {
  name = PLAYWRIGHT_WALLET_NAME;
  url = "https://agent-protocol.reddi.tech";
  icon =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' rx='12' fill='%23111827'/%3E%3Cpath d='M18 46V18h14c8 0 14 6 14 14s-6 14-14 14H18zm8-8h6c3.3 0 6-2.7 6-6s-2.7-6-6-6h-6v12z' fill='%239945FF'/%3E%3C/svg%3E";

  readonly supportedTransactionVersions = new Set(["legacy", 0] as const);
  private _publicKey: PublicKey | null = null;
  private _connected = false;
  private _connecting = false;

  get publicKey() {
    return this._publicKey;
  }

  get connected() {
    return this._connected;
  }

  get connecting() {
    return this._connecting;
  }

  get readyState() {
    return WalletReadyState.Installed;
  }

  async connect(): Promise<void> {
    if (this._connected) return;
    this._connecting = true;
    this._publicKey = PLAYWRIGHT_PUBLIC_KEY;
    this._connected = true;
    this._connecting = false;
    this.emit("connect", this._publicKey);
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;
    this._connected = false;
    this._publicKey = null;
    this.emit("disconnect");
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: SendOptions
  ): Promise<TransactionSignature> {
    if (PLAYWRIGHT_SIGNER) {
      if (transaction instanceof VersionedTransaction) {
        transaction.sign([PLAYWRIGHT_SIGNER]);
      } else {
        transaction.partialSign(PLAYWRIGHT_SIGNER);
      }

      const raw = transaction.serialize();
      return connection.sendRawTransaction(raw, options);
    }

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
