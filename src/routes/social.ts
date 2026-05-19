import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function socialRoutes(app: FastifyInstance) {

  // ── Likes de evento ──────────────────────────────────────────

  // GET /events/:id/likes  (pública — devuelve count + si el usuario autenticado dio like)
  app.get('/events/:id/likes', async (req, reply) => {
    const { id: eventId } = req.params as any;
    let userId: string | null = null;
    try {
      await req.jwtVerify();
      userId = (req.user as any).sub;
    } catch {}

    const count = await prisma.eventLike.count({ where: { eventId } });
    const liked = userId
      ? !!(await prisma.eventLike.findUnique({ where: { userId_eventId: { userId, eventId } } }))
      : false;

    return reply.send({ count, liked });
  });

  // POST /events/:id/like  (toggle — requiere auth)
  app.post('/events/:id/like', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: eventId } = req.params as any;
    const { sub: userId } = req.user as any;

    const existing = await prisma.eventLike.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (existing) {
      await prisma.eventLike.delete({ where: { id: existing.id } });
      const count = await prisma.eventLike.count({ where: { eventId } });
      return reply.send({ liked: false, count });
    } else {
      await prisma.eventLike.create({ data: { userId, eventId } });
      const count = await prisma.eventLike.count({ where: { eventId } });
      return reply.send({ liked: true, count });
    }
  });

  // ── Comentarios de evento ────────────────────────────────────

  // GET /events/:id/comments
  app.get('/events/:id/comments', async (req, reply) => {
    const { id: eventId } = req.params as any;
    let userId: string | null = null;
    try { await req.jwtVerify(); userId = (req.user as any).sub; } catch {}

    const comments = await prisma.eventComment.findMany({
      where: { eventId, parentId: null },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } }, likes: true },
          orderBy: { createdAt: 'asc' },
        },
        likes: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const format = (c: any) => ({
      id: c.id,
      author: c.user.name,
      authorId: c.user.id,
      text: c.text,
      time: formatTime(c.createdAt),
      likes: c.likes.length,
      likedByMe: userId ? c.likes.some((l: any) => l.userId === userId) : false,
      replies: (c.replies || []).map(format),
    });

    return reply.send(comments.map(format));
  });

  // POST /events/:id/comments  (requiere auth)
  app.post('/events/:id/comments', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id: eventId } = req.params as any;
    const { sub: userId } = req.user as any;
    const { text, parentId } = req.body as any;

    if (!text?.trim()) return reply.status(400).send({ error: 'text es requerido' });

    const comment = await prisma.eventComment.create({
      data: { userId, eventId, text: text.trim(), parentId: parentId ?? null },
      include: { user: { select: { id: true, name: true } } },
    });

    return reply.status(201).send({
      id: comment.id,
      author: comment.user.name,
      authorId: comment.user.id,
      text: comment.text,
      time: 'ahora',
      likes: 0,
      likedByMe: false,
      replies: [],
    });
  });

  // POST /events/:id/comments/:commentId/like  (toggle — requiere auth)
  app.post('/events/:id/comments/:commentId/like', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { commentId } = req.params as any;
    const { sub: userId } = req.user as any;

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      const count = await prisma.commentLike.count({ where: { commentId } });
      return reply.send({ liked: false, count });
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });
      const count = await prisma.commentLike.count({ where: { commentId } });
      return reply.send({ liked: true, count });
    }
  });
}

function formatTime(date: Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
