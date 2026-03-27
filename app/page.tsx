import { VendimiaWorld } from '@/components/vendimia/vendimia-world';
import { AgentPaymentsPanel } from '@/components/hedera/agent-payments-panel';
import { TransactionPanel } from '@/components/wallet/transaction-panel';
import { WalletButton } from '@/components/wallet/wallet-button';

export default function Home() {
  return (
    <>
      <VendimiaWorld />
      <div className="pointer-events-none fixed left-4 top-[5.25rem] z-[95] md:left-[18.5rem] md:top-4">
        <div
          className="pointer-events-auto flex flex-wrap items-start gap-1.5 rounded-xl p-1.5 md:flex-row"
          style={{
            background: 'rgba(32, 21, 14, 0.42)',
            border: '3px solid rgba(45, 34, 26, 0.9)',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.24)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <WalletButton docked />
          <TransactionPanel docked />
          <AgentPaymentsPanel docked />
        </div>
      </div>
    </>
  );
}
