import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function eventsRoutes(app: FastifyInstance) {

  // GET /events/mine  (antes de /:id para evitar colisión de rutas)
  app.get('/events/mine', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any;
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId, status: 'confirmed' },
      include: {
        event: { include: { discipline: true, instructor: true, sede: true } },
      },
      orderBy: { event: { startsAt: 'asc' } },
    });
    return reply.send(registrations.map(r => r.event));
  });

  // GET /events  (con filtros: ?sedeId=&disciplineId=&from=&to=)
  app.get('/events', async (req, reply) => {
    const { sedeId, disciplineId, from, to } = req.query as any;

    const events = await prisma.event.findMany({
      where: {
        status: 'published',
        ...(sedeId && { sedeId }),
        ...(disciplineId && { disciplineId }),
        startsAt: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to) }),
        },
      },
      include: {
        discipline: true,
        instructor: true,
        sede: true,
        _count: { select: { registrations: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    const result = events.map(e => ({
      ...e,
      taken: e._count.registrations,
      _count: undefined,
    }));

    return reply.send(result);
  });

  // GET /events/:id
  app.get('/events/:id', async (req, reply) => {
    const { id } = req.params as any;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        discipline: true,
        instructor: true,
        sede: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return reply.status(404).send({ error: 'Evento no encontrado' });

    return reply.send({ ...event, taken: event._count.registrations, _count: undefined });
  });

  // POST /events/:id/rsvp  (requiere auth)
  app.post('/events/:id/rsvp', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: eventId } = req.params as any;
    const { sub: userId } = req.user as any;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) return reply.status(404).send({ error: 'Evento no encontrado' });

    const taken = event._count.registrations;
    const status = taken >= event.spots ? 'waitlist' : 'confirmed';

    const registration = await prisma.eventRegistration.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId, status },
      update: { status },
    });

    return reply.status(201).send(registration);
  });

  // DELETE /events/:id/rsvp  (cancela RSVP)
  app.delete('/events/:id/rsvp', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: eventId } = req.params as any;
    const { sub: userId } = req.user as any;

    await prisma.eventRegistration.deleteMany({ where: { userId, eventId } });
    return reply.status(204).send();
  });

}
