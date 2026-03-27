# Hedera Track MVP

Este repo ahora incluye un MVP para el track de Hedera orientado a pagos a traves de agentes.

## Que hace

- Usa el SDK oficial `@hashgraph/sdk`
- Expone `GET/POST /api/hedera/agent-payment`
- Ejecuta una transferencia HBAR con memo semantico para representar una decision o liquidacion de un agente
- Muestra una UI minima en la home para disparar el pago y ver el resultado

## Variables de entorno

```bash
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
```

## De donde saco HEDERA_OPERATOR_ID y HEDERA_OPERATOR_KEY

La forma mas simple para este proyecto es usar Hedera Testnet Portal:

1. Abri `https://portal.hedera.com/register`
2. Crea una cuenta de testnet
3. El portal te entrega:
	- `Account ID`: formato `0.0.xxxxxxx`
	- `Private Key`: la clave privada del operador
4. Guarda esos valores en tu entorno local

Chequeo rapido desde el repo:

```bash
corepack pnpm hedera:setup
```

Ese comando:

- te dice si las variables faltan
- valida si el `Account ID` y la `Private Key` tienen formato correcto
- te reimprime los pasos si algo esta mal

### PowerShell

```powershell
$env:HEDERA_NETWORK="testnet"
$env:HEDERA_OPERATOR_ID="0.0.xxxxxxx"
$env:HEDERA_OPERATOR_KEY="tu_private_key"
corepack pnpm hedera:setup
```

### .env.local

```bash
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxxxx
HEDERA_OPERATOR_KEY=tu_private_key
```

## Flujo

1. El front envia `recipientId`, `amount`, `serviceId` y `agentGoal`
2. La ruta server arma un memo `agent:<serviceId> <agentGoal>`
3. El operador de Hedera firma y envia el pago HBAR
4. La respuesta devuelve `transactionId`, estado y URL de HashScan

## Por que sirve para el track

- Pagos rapidos y baratos para agentes autonomos
- Rastro verificable en Hedera con `memo`
- Back-end simple de conectar a un planificador, bot o agente LLM
- Puede extenderse despues a HTS, stablecoins o smart contracts si el pitch lo requiere