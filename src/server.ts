import app from './app';
import { config } from './config';
import { prisma } from './config/prisma';

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('Connected successfully to PostgreSQL database via Prisma.');

    const server = app.listen(config.port, () => {
      console.log(`SRTES API Server is running on port ${config.port} [${config.nodeEnv}]`);
      console.log(`Health Check: http://localhost:${config.port}/api/health`);
    });

    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('PostgreSQL connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start SRTES server:', error);
    process.exit(1);
  }
}

startServer();
