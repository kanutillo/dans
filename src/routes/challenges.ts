import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function challengesRoutes(app: FastifyInstance) {

  // GET /challenges  (retos activos)
  app.get('/challenges', async (_, reply) => {
    const now = new Date();
    const challenges = await prisma.challenge.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    });
    return reply.send(challenges);
  });

  // GET /challenges/me  (progreso del usuario en retos)
  app.get('/challenges/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any;

    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(userChallenges);
  });
}
