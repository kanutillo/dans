import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function sedesRoutes(app: FastifyInstance) {

  // GET /sedes
  app.get('/sedes', async (_, reply) => {
    const sedes = await prisma.sede.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(sedes);
  });

  // GET /sedes/:id
  app.get('/sedes/:id', async (req, reply) => {
    const { id } = req.params as any;
    const sede = await prisma.sede.findUnique({ where: { id } });
    if (!sede) return reply.status(404).send({ error: 'Sede no encontrada' });
    return reply.send(sede);
  });
}
