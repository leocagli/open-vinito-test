// Stellar Wallets Kit — unified multi-wallet connector
// Supports Freighter, xBull, Albedo, Rabet, WalletConnect, Lobstr, and more
// Replaces the single Freighter integration with a universal wallet layer

'use client';

// Dynamic import to avoid SSR issues
export async function getStellarWalletsKit() {
  const { StellarWalletsKit, WalletNetwork, FREIGHTER_ID, LOBSTR_ID, xBullModule, FreighterModule, LobstrModule } =
    await import('@creit.tech/stellar-wallets-kit');

  const network =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
      ? WalletNetwork.PUBLIC
      : WalletNetwork.TESTNET;

  const kit = new StellarWalletsKit({
    network,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule(), new LobstrModule(), new xBullModule()],
  });

  return { kit, network, FREIGHTER_ID, LOBSTR_ID };
}

export type WalletConnectResult = {
  address: string;
  walletId: string;
  network: string;
};

// Open the wallet selector modal and return the selected wallet's address
export async function openWalletSelector(): Promise<WalletConnectResult | null> {
  try {
    const { kit } = await getStellarWalletsKit();

    return new Promise((resolve) => {
      kit.openModal({
        onWalletSelected: async (option: any) => {
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';
            resolve({ address, walletId: option.id, network });
          } catch {
            resolve(null);
          }
        },
        onClosed: () => resolve(null),
      });
    });
  } catch {
    return null;
  }
}

// Sign a transaction with the currently selected wallet
export async function signWithWalletsKit(xdr: string): Promise<string | null> {
  try {
    const { kit } = await getStellarWalletsKit();
    const networkPassphrase =
      process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
        ? 'Public Global Stellar Network ; September 2015'
        : 'Test SDF Network ; September 2015';

    const { signedTxXdr } = await kit.signTransaction(xdr, { networkPassphrase });
    return signedTxXdr ?? null;
  } catch {
    return null;
  }
}
