import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  app.post('/auth/register', async (req, reply) => {
    const { email, password, name } = req.body as any;

    if (!email || !password || !name) {
      return reply.status(400).send({ error: 'email, password y name son requeridos' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(409).send({ error: 'Email ya registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profile: { create: {} },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return reply.status(201).send({ user, token });
  });

  // POST /auth/login
  app.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body as any;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.status(401).send({ error: 'Credenciales incorrectas' });

    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  });

  // PATCH /auth/me
  app.patch('/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any;
    const { name } = req.body as any;
    if (!name?.trim()) return reply.status(400).send({ error: 'name es requerido' });
    const user = await prisma.user.update({
      where: { id: sub },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
    return reply.send(user);
  });

  // GET /auth/me
  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub } = req.user as any;
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true, email: true, name: true, role: true, avatarUrl: true,
        profile: {
          include: {
            sede: true,
            favorites: { include: { discipline: true } },
          },
        },
      },
    });
    if (!user) return reply.status(404).send({ error: 'Usuario no encontrado' });
    return reply.send(user);
  });
}
