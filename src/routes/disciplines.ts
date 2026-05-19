import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function disciplinesRoutes(app: FastifyInstance) {

  // GET /disciplines
  app.get('/disciplines', async (_, reply) => {
    const disciplines = await prisma.discipline.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(disciplines);
  });

  // GET /disciplines/:id
  app.get('/disciplines/:id', async (req, reply) => {
    const { id } = req.params as any;
    const discipline = await prisma.discipline.findUnique({
      where: { id },
      include: {
        instructors: { include: { instructor: true } },
      },
    });
    if (!discipline) return reply.status(404).send({ error: 'Disciplina no encontrada' });
    return reply.send(discipline);
  });
}
