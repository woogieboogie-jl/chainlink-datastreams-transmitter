# base node image

FROM node:21-bullseye-slim as base

# set for base and all layer that inherit from it

ENV NODE_ENV production

# Install all node_modules, including dev dependencies

FROM base as deps

WORKDIR /broadcaster

ADD package.json ./
RUN npm install --include=dev

# Setup production node_modules

FROM base as production-deps

WORKDIR /broadcaster

COPY --from=deps /broadcaster/node_modules /broadcaster/node_modules
ADD package.json ./
RUN npm prune --omit=dev

# Build the app

FROM base as build

WORKDIR /broadcaster

COPY --from=deps /broadcaster/node_modules /broadcaster/node_modules

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint

FROM base

WORKDIR /broadcaster

COPY --from=production-deps /broadcaster/node_modules /broadcaster/node_modules

COPY --from=build /broadcaster/build /broadcaster/build
COPY --from=build /broadcaster/public /broadcaster/public
ADD . .

CMD ["npm", "start"]