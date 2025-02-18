<div style="text-align:center" align="center">
    <a href="https://chain.link" target="_blank">
        <img src="https://raw.githubusercontent.com/smartcontractkit/chainlink/develop/docs/logo-chainlink-blue.svg" width="225" alt="Chainlink logo">
    </a>

[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/smartcontractkit/ccip-javascript-sdk/blob/main/LICENSE)
[![Data Streams Documentation](https://img.shields.io/static/v1?label=data-streams-docs&message=latest&color=blue)](https://docs.chain.link/data-streams/)
</div>

# Chainlink Data Streams Scheduler

Data Streams is an on-demand, low-latency data oracle service that allows users to retrieve data at sub-second intervals. While Data Streams enables off-chain data access, this scheduler aims to bring that data on-chain in a manner consistent with the traditional Data Feeds 1.0 model.

The scheduler will monitor off-chain Data Streams prices and update on-chain prices based on predefined conditions. It will write data to the blockchain at specified intervals or when there is a significant deviation from the last on-chain price, ensuring timely and accurate data delivery for blockchain applications.

--- 

Built with:
- [Remix](https://remix.run/docs)
- [Redis](https://redis.io)
- [Docker](https://www.docker.com)

## Table of contents

- [Chainlink Data Streams Scheduler](#chainlink-data-streams-scheduler)
  - [Table of contents](#table-of-contents)
  - [System Architecture Overview](#system-architecture-overview)
  - [Environment Variables](#environment-variables)
  - [Deployment \& Containerization](#deployment--containerization)
  - [Starting the Application](#starting-the-application)
  - [Development](#development)
    - [Modifications](#modifications)
  - [Styling](#styling)
  - [License](#license)
  - [Resources](#resources)

## System Architecture Overview

```mermaid
graph TD
    A[Streams Aggregation Network] -->|1.Monitors prices via websocket| B[Data Streams Chain Scheduler]
    B -->|2.Retrieves Verified Reports at set interval or deviation| C[Streams Verifier Contract]
    B -->|3.Writes Prices on-chain to data feeds contract| D[ETH/USD]
    B -->|3.Writes Prices on-chain to data feeds contract| E[BTC/USD]
    
    subgraph Blockchain
        C --> D
        C --> E
    end
```

## Environment Variables

To make setting environment variables easier there is a `.env.example` file in the root folder of this project. You can copy it to a new `.env` file and replace the values with your own.

| Name                        | Description                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `REDIS_PASSWORD`            | Required for the local persistance layer operation. If not provided the setup will fallback to the default Redis password.                    |
| `PRIVATE_KEY`               | Used to make payments in LINK for the Data Streams verifications on-chain and for writing data on-chain on the user provided custom contract. |
| `DATASTREAMS_HOSTNAME`      | Chainlink Data Streams Authentication Credentials                                                                                             |
| `DATASTREAMS_WS_HOSTNAME`   | Chainlink Data Streams Authentication Credentials                                                                                             |
| `DATASTREAMS_CLIENT_ID`     | Chainlink Data Streams Authentication Credentials                                                                                             |
| `DATASTREAMS_CLIENT_SECRET` | Chainlink Data Streams Authentication Credentials                                                                                             |

> [!NOTE]
> All other user configurations are stored locally using Redis, eliminating the need for separate configuration files. This ensures fast access and persistence across sessions without manual file handling. Only sensitive configurations, such as API keys and database credentials, are managed separately in the `.env` file. The application automatically loads and updates configurations in Redis as needed. Users do not need to manually edit or maintain configuration files, simplifying setup and deployment.

## Deployment & Containerization  

The entire application is containerized and is designed to be run using the provided `docker-compose` setup. This ensures a seamless environment by automatically managing all required services, including the local Redis database, WebSocket listeners, logging, verification services, and the frontend management application. Running `docker-compose up` will spin up all necessary containers with minimal setup. This approach simplifies deployment, ensures consistency across environments, and reduces configuration overhead. For production use, consider customizing the `docker-composе.yml` file or extending the setup as needed.
## Starting the Application
Before starting the application, ensure that all necessary environment variables are set in the `.env` file. Missing variables may cause services to fail or behave unexpectedly.

Once the environment is configured, start the application using:

```sh
docker compose up
```

## Development

For development, you can either use the provided docker-compose setup or run services manually. To start the application in a containerized environment, use:

```sh
docker compose up
```

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