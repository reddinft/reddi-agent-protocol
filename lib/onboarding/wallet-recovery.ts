import "server-only";

import { existsSync } from "fs";
import { join } from "path";

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  steps: string[];
  warning?: string;
}

const BACKUP_PATH = join(process.cwd(), "data", "onboarding", "wallet-backup-checkpoint.json");

export function checkWalletBackupExists(): boolean {
  return existsSync(BACKUP_PATH);
}

export function getWalletRecoveryOptions(): RecoveryOption[] {
  const backupExists = checkWalletBackupExists();

  return [
    {
      id: "backup",
      label: "Restore from backup checkpoint",
      description: backupExists
        ? "A backup checkpoint file was found."
        : "No backup checkpoint found.",
      steps: [
        "Locate data/onboarding/wallet-backup-checkpoint.json",
        "Enter your passphrase when prompted",
        "The encrypted key will be decrypted and loaded",
      ],
      warning: backupExists ? undefined : "No backup checkpoint found, this option may not work",
    },
    {
      id: "keypair",
      label: "Import wallet from Solana keypair file",
      description: "Import a raw keypair JSON file (array of 64 bytes).",
      steps: [
        "Locate your Solana keypair file (e.g. ~/.config/solana/id.json)",
        "Paste the contents (JSON byte array) into the import field",
        "The wallet will be imported and ready to use",
      ],
    },
    {
      id: "fresh",
      label: "Start fresh (new wallet + re-register)",
      description: "Create a new wallet and re-register your specialist.",
      steps: [
        "A new encrypted wallet will be created",
        "You must deregister your old on-chain agent first, if still active",
        "Then complete registration with the new wallet",
      ],
      warning:
        "Your old on-chain registration will need to be manually deregistered to recover the registration fee",
    },
  ];
}
