<div style="text-align:center" align="center">
    <a href="https://chain.link" target="_blank">
        <img src="https://raw.githubusercontent.com/smartcontractkit/chainlink/develop/docs/logo-chainlink-blue.svg" width="225" alt="Chainlink logo">
    </a>

[![License](https://img.shields.io/badge/license-GPL-blue)](https://github.com/smartcontractkit/ccip-javascript-sdk/blob/main/LICENSE)
[![Data Streams Documentation](https://img.shields.io/static/v1?label=data-streams-docs&message=latest&color=blue)](https://docs.chain.link/data-streams/)

</div>

# Chainlink Data Streams Broadcaster

## Overview

Chainlink Data Streams Broadcaster is a service that bridges off-chain data streams with on-chain smart contracts. It continuously monitors off-chain price updates and pushes them on-chain based on predefined conditions such as price deviations or time intervals.

### Key Features:

- Retrieves and verifies price data from Chainlink Data Streams.
- Writes verified prices to on-chain smart contracts.
- Supports containerized deployment with Docker.
- Configurable through environment variables and Redis-based settings.

---

## Table of contents

- [Chainlink Data Streams Broadcaster](#chainlink-data-streams-broadcaster)
  - [Overview](#overview)
    - [Key Features:](#key-features)
  - [Table of contents](#table-of-contents)
  - [System Architecture Overview](#system-architecture-overview)
  - [Installation Instructions](#installation-instructions)
    - [Prerequisites](#prerequisites)
    - [Installation Steps](#installation-steps)
  - [Environment Variables](#environment-variables)
  - [YAML Configuration Setup](#yaml-configuration-setup)
    - [YAML Configuration](#yaml-configuration)
    - [Example YAML Configuration](#example-yaml-configuration)
    - [Key Configuration Parameters](#key-configuration-parameters)
  - [Deployment Guide](#deployment-guide)
    - [Running with Docker Compose](#running-with-docker-compose)
    - [Production Deployment](#production-deployment)
  - [UI Setup Instructions](#ui-setup-instructions)
  - [Logging](#logging)
  - [Testing Commands](#testing-commands)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues \& Fixes](#common-issues--fixes)
  - [Modifications \& Further Development](#modifications--further-development)
    - [Modifications](#modifications)
  - [Styling](#styling)
  - [License](#license)
  - [Resources](#resources)

## System Architecture Overview

```mermaid
graph TD
    A[Streams Aggregation Network] -->|1.Monitors prices via websocket| B[Data Streams Chain Broadcaster]
    B -->|2.Retrieves Verified Reports at set interval or deviation| C[Streams Verifier Contract]
    B -->|3.Writes Prices on-chain to data feeds contract| D[ETH/USD]
    B -->|3.Writes Prices on-chain to data feeds contract| E[BTC/USD]

    subgraph Blockchain
        C --> D
        C --> E
    end
```

---

## Installation Instructions

Before setting up the Broadcaster, ensure you have the required dependencies installed.

### Prerequisites

- **Docker & Docker Compose**: [Install Docker](https://docs.docker.com/get-docker/)
- **Node.js & npm**: [Install Node.js](https://nodejs.org/)
- **Redis** (Optional for local development): [Install Redis](https://redis.io/docs/getting-started/)

### Installation Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/hackbg/chainlink-datastreams-broadcaster.git
   cd chainlink-datastreams-broadcaster
   ```
2. Copy the example environment file:
   ```sh
   cp .env.example .env
   ```
3. Update the `.env` file with your credential details (explained below) and optionally provide a `config.yml` file following the examples below.

> [!TIP]
> To ensure you won't miss any of the needed variables to be set - you can copy the provided `.env.example` and `config-example.yml` to `.env` and `config.yml` respectively and only fill in the details.

4. Install dependencies:
   ```sh
   npm install
   ```
5. Start the application:
   ```sh
   docker compose up -d
   ```
6. Access the frontend of the application at http://localhost:3000

---

## Environment Variables

To make setting environment variables easier there is a `.env.example` file in the root folder of this project. You can copy it to a new `.env` file and replace the values with your own.

| Name                        | Description                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `REDIS_PASSWORD`            | Required for the local persistance layer operation. If not provided the setup will fallback to the default Redis password.                    |
| `PRIVATE_KEY`               | Used to make payments in LINK for the Data Streams verifications on-chain and for writing data on-chain on the user provided custom contract. |
| `DATASTREAMS_HOSTNAME`      | Chainlink Data Streams Hostname.                                                                                                              |
| `DATASTREAMS_WS_HOSTNAME`   | WebSocket Hostname for Data Streams.                                                                                                          |
| `DATASTREAMS_CLIENT_ID`     | Client ID for authentication.                                                                                                                 |
| `DATASTREAMS_CLIENT_SECRET` | Client Secret for authentication.                                                                                                             |  |

> [!NOTE]
> All other user configurations are stored locally using Redis file eliminating the need for separate configuration files. This ensures fast access and persistence across sessions without manual file handling. Only sensitive configurations, such as API keys and database credentials, are managed separately in the `.env` file. The application automatically loads and updates configurations in Redis as needed. Users do not need to manually edit or maintain configuration files, simplifying setup and deployment.
> 
> Optional: The initial configurations can also be seeded by providing a `config.yml` file. See the `config-example.yml` and section below for more details.

---

## YAML Configuration Setup

Although configurations are stored in Redis, an example YAML configuration is provided for reference. This YAML file can be used to seed the Redis configuration parameters automatically without requiring manual input through the UI. This approach simplifies setup and allows for easier reproducibility of configurations across multiple instances of the service.

Using a YAML file for configuration also makes it possible to replicate a specific setup by copying the file across different instances of the Broadcaster. This ensures that deployments remain consistent and eliminates the need for repeated manual configuration when scaling the service.

### YAML Configuration

```yaml
# List of Chainlink Data feeds that the broadcaster will subscribe to
feeds:
  # Name of the feed
  - name: 'ETH/USD'
    # Unique identifier for the feed (Ref: https://docs.chain.link/data-streams/crypto-streams?page=1)
    feedId: '0x...'
# The target blockchain network ID (the network the Broadcaster will write the data to)
chainId: 43113
# Maximum gas limit. This is the maximum amount of gas you are willing to spend on a transaction.
# If the estimated gas is greater, the transaction will be canceled.
# The value is set in WEI (the smallest unit on the chain).
gasCap: '150000'
# The interval to check for price changes and write on-chain.
# It is represented as a cron expression with granularity in seconds.
# Tip: You can build and verify your cron expression easily using helpers such as https://crontab.guru
interval: '* * * * * *'
# The price deviation. Only changes that are with
# equal to or greater percentage difference will be written on-chain.
priceDeltaPercentage: 0.01
# Additional EVM chains can be added in this configuration.
chains:
  # Each additional chain should be added to the configuration with the following mandatory properties: id, name, currencyName, currencySymbol, currencyDecimals, rpc.
  # Optional: Set the `testnet` property to 'true' if this is a test network.
  # Removing this property makes the broadcaster consider the network a mainnet.
  - id: 995
    name: '🔥 5ireChain'
    currencyName: '5ire Token'
    currencySymbol: '5IRE'
    currencyDecimals: 18
    rpc: 'https://rpc.5ire.network'
# List the Data Streams verifier contract address for each custom chain
verifierAddresses:
  - chainId: 84532
    address: '0x...'
# Target contracts to write data on-chain configuration. Map each feedId to a contract address and
# set the functionName with the arguments to be called. Contract ABI should also be provided.
targetContracts:
  - feedId: '0x...'
    address: '0x...'
    functionName: 'functionNameHere'
    functionArgs:
      - 'feedId'
      - 'validFromTimestamp'
      - 'observationsTimestamp'
      - 'nativeFee'
      - 'linkFee'
      - 'expiresAt'
      - 'price'
      - 'bid'
      - 'ask'
    abi: [...]
```

### Example YAML Configuration

```yaml
feeds:
  - name: 'AVAX/USD'
    feedId: '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796'
  - name: 'ETH/USD'
    feedId: '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba782'
chainId: 43113
gasCap: '150000'
interval: '*/30 * * * * *'
priceDeltaPercentage: 0.01
chains:
  - id: 995
    name: '🔥 5ireChain'
    currencyName: '5ire Token'
    currencySymbol: '5IRE'
    currencyDecimals: 18
    rpc: 'https://rpc.5ire.network'
  - id: 84532
    name: 'Base Sepolia Custom'
    currencyName: 'Sepoloa Ether'
    currencySymbol: 'ETH'
    currencyDecimals: 18
    rpc: 'https://sepolia.base.org'
    testnet: true
verifierAddresses:
  - chainId: 995
    address: '0x...'
  - chainId: 84532
    address: '0x...'
targetContracts:
  - feedId: '0x0003735a076086936550bd316b18e5e27fc4f280ee5b6530ce68f5aad404c796'
    address: '0xfa162F0A25b2C2aA32Ddaacda872B6D7b2c38E47'
    functionName: 'set'
    functionArgs:
      - 'feedId'
      - 'validFromTimestamp'
      - 'observationsTimestamp'
      - 'nativeFee'
      - 'linkFee'
      - 'expiresAt'
      - 'price'
      - 'bid'
      - 'ask'
    abi:
      [
        {
          'inputs':
            [
              {
                'internalType': 'bytes32',
                'name': 'feedId',
                'type': 'bytes32',
              },
              {
                'internalType': 'uint32',
                'name': 'validFromTimestamp',
                'type': 'uint32',
              },
              {
                'internalType': 'uint32',
                'name': 'observationsTimestamp',
                'type': 'uint32',
              },
              {
                'internalType': 'uint192',
                'name': 'nativeFee',
                'type': 'uint192',
              },
              {
                'internalType': 'uint192',
                'name': 'linkFee',
                'type': 'uint192',
              },
              {
                'internalType': 'uint32',
                'name': 'expiresAt',
                'type': 'uint32',
              },
              { 'internalType': 'int192', 'name': 'price', 'type': 'int192' },
              { 'internalType': 'int192', 'name': 'bid', 'type': 'int192' },
              { 'internalType': 'int192', 'name': 'ask', 'type': 'int192' },
            ],
          'name': 'set',
          'outputs': [],
          'stateMutability': 'nonpayable',
          'type': 'function',
        },
      ]
```

### Key Configuration Parameters

- `feeds` - List of price feeds with unique `feedId`s.
- `chainId`: Target blockchain network ID.
- `gasCap`: Maximum gas limit for transactions.
- `interval`: Cron expression defining data update frequency.
- `priceDeltaPercentage`: Minimum price deviation percent before an update is triggered.
- `chains`: List of supported blockchain networks with RPC URLs.
- `verifierAddresses`: The Data Streams verifier contracts for any custom chains added to the config.
- `targetContracts`: The smart contracts to interact with.
  - `functionName`: Name of the smart contract function to call.
  - `functionArgs`: List of required arguments for the contract function.
  - `abi`: Function definition used for contract interactions.

To apply changes, restart the Broadcaster using:

```sh
docker compose restart
```

---

## Deployment Guide

The entire application is containerized and is designed to be run using the provided `docker-compose` setup. This ensures a seamless environment by automatically managing all required services, including the local Redis database, WebSocket listeners, logging, verification services, and the frontend management application. Running `docker compose up` will spin up all necessary containers with minimal setup. This approach simplifies deployment, ensures consistency across environments, and reduces configuration overhead. For production use, consider customizing the `docker-composе.yml` file or extending the setup as needed.

Before starting the application, ensure that all necessary environment variables are set in the `.env` file. Missing variables may cause services to fail or behave unexpectedly.

### Running with Docker Compose

1. Ensure the `.env` file is present and you've added the necessary environment variables.
2. Start the service:
   ```sh
   docker compose up -d
   ```
3. To stop the service:
   ```sh
   docker compose down
   ```

### Production Deployment

- Modify `docker-compose.yml` to set up persistent storage and environment variables.
- If the service is going to be accessible externally consider running it behind a reverse proxy like Nginx.

---

## UI Setup Instructions

The Broadcaster provides a UI for managing feeds. It is automatically enabled if you start the broadcaster using the Docker compose file as mentioned in the instructions above.

To start it manually outside of the docker setup:

1. Start the UI service using:
   ```sh
   npm run dev
   ```
2. Access it via `http://localhost:3000`.

> [!NOTE]
> The UI requires a running Redis instance. Make sure a Redis instance is running and the authentication credentials are set in the `.env` file when running the UI outside of the containerized setup in the docker configuration.

---

## Logging

The application supports different logging levels:

- **INFO**: General system status.
- **DEBUG**: Detailed debugging output.
- **ERROR**: Critical failures.

Logs can be accessed via:

```sh
docker logs -f broadcaster
```

The application stores logs in the `logs` directory to maintain an audit trail of user actions and configuration changes. They can also be used for troubleshooting..

---

## Testing Commands

After deployment, verify the setup with:

- Verify logs:
  ```sh
  docker logs broadcaster
  ```

---

## Troubleshooting

### Common Issues & Fixes

- **Service not starting?**
  - Ensure `.env` file is correctly configured.
  - Run `docker compose logs` for errors.
- **Data not updating?**
  - Verify the RPC endpoint.
  - Check Redis for correct configurations.
- **Authentication failures?**
  - Ensure `DATASTREAMS_CLIENT_ID` and `DATASTREAMS_CLIENT_SECRET` are valid.

---

## Modifications & Further Development

For development, you can either use the provided docker-compose setup or run services manually. To start the application in a containerized environment, use:

```sh
docker compose up -d --build
```

> [!NOTE]
> Using the `--build` flag in the above command ensures the changes you've made to the project are present in the newly built docker image.

If you prefer running the application locally, ensure that Redis is installed and running. Then, install dependencies and start the application:

```sh
npm install
npm run dev
```

Modify the `.env` file as needed for local development. Logs and debugging tools are integrated to assist with development and troubleshooting.

### Modifications

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

If you're making changes to the application, restart the affected services or use hot-reloading where supported to apply modifications efficiently.

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.

## License

This project is licensed under the GNU General Public License (GPL). This means you are free to use, modify, and distribute the software, provided that any derivative work is also licensed under the GPL.

By contributing to this project, you agree that your contributions will be governed by the same license. For full details, see the LICENSE file.

## Resources

- [Chainlink Data Streams Documentation](https://docs.chain.link/data-streams)
- [Chainlink Documentation](https://docs.chain.link/)
