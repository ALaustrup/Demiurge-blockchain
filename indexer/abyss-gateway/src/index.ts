// Abyss Gateway - GraphQL API for Demiurge chain data
//
// This is a Phase 4 skeleton. Later phases will connect to PostgreSQL
// and provide real queries for NFTs, listings, Fabric assets, etc.

import { createServer } from '@graphql-yoga/node';

const typeDefs = /* GraphQL */ `
  type Query {
    _health: String!
  }
`;

const resolvers = {
  Query: {
    _health: () => 'Abyss gateway is alive (Phase 4 skeleton).',
  },
};

async function main() {
  const server = createServer({
    schema: {
      typeDefs,
      resolvers,
    },
    port: Number(process.env.PORT || 4000),
  });

  await server.start();
  console.log(`Abyss gateway running on http://localhost:${process.env.PORT || 4000}`);
}

main().catch((err) => {
  console.error('Abyss gateway failed:', err);
  process.exit(1);
});

