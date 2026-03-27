import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';

const ADDR = '0xC468255CEcC1cE5D0A6ca09536518F96f9ab3060';
const rpcs = [
  'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet-rpc.publicnode.com',
];

for (const rpc of rpcs) {
  try {
    const c = createPublicClient({ chain: bscTestnet, transport: http(rpc) });
    const bal = await c.getBalance({ address: ADDR });
    console.log(rpc.split('/')[2], ':', Number(bal) / 1e18, 'tBNB');
  } catch (e) {
    console.log(rpc.split('/')[2], ': ERROR', e.message.slice(0, 60));
  }
}
