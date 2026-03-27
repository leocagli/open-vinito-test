import { VendimiaWorld } from '@/components/vendimia/vendimia-world';
import { AgentPaymentsPanel } from '@/components/hedera/agent-payments-panel';
import { TransactionPanel } from '@/components/wallet/transaction-panel';

export default function Home() {
  return (
    <>
      <VendimiaWorld />
      <TransactionPanel />
      <AgentPaymentsPanel />
    </>
  );
}
