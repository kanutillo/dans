import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function profileRoutes(app: FastifyInstance) {

  // GET /profile
  app.get('/profile', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        sede: true,
        favorites: { include: { discipline: true } },
      },
    });

    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const stats = await prisma.classAttendance.count({ where: { userId } });

    return reply.send({ profile, badges, totalClasses: stats });
  });

  // PATCH /profile  (actualizar sede, favoritos)
  app.patch('/profile', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any;
    const { sedeId, favoriteIds } = req.body as any;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return reply.status(404).send({ error: 'Perfil no encontrado' });

    if (sedeId !== undefined) {
      await prisma.profile.update({ where: { userId }, data: { sedeId } });
    }

    if (Array.isArray(favoriteIds)) {
      await prisma.favoriteDiscipline.deleteMany({ where: { profileId: profile.id } });
      await prisma.favoriteDiscipline.createMany({
        data: favoriteIds.map((disciplineId: string) => ({ profileId: profile.id, disciplineId })),
      });
    }

    return reply.send({ ok: true });
  });

  // GET /profile/badges
  app.get('/profile/badges', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any;

    const earned = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    const allBadges = await prisma.badge.findMany();
    const earnedIds = new Set(earned.map((b: any) => b.badgeId));
    const locked = allBadges.filter((b: any) => !earnedIds.has(b.id));

    return reply.send({ earned, locked });
  });
}
