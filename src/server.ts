import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import { authRoutes }        from './routes/auth';
import { sedesRoutes }       from './routes/sedes';
import { disciplinesRoutes } from './routes/disciplines';
import { eventsRoutes }      from './routes/events';
import { challengesRoutes }  from './routes/challenges';
import { profileRoutes }     from './routes/profile';
import { socialRoutes }      from './routes/social';

const app = Fastify({ logger: true });

// Permite bodies JSON vacíos (e.g. POST /rsvp sin payload)
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  if (!body || (body as string).trim() === '') { done(null, {}); return; }
  try { done(null, JSON.parse(body as string)); }
  catch (e: any) { done(e); }
});

// Plugins
app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET! });

// Decorator para autenticación
app.decorate('authenticate', async (req: any, reply: any) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'No autorizado' });
  }
});

// Health check
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// Rutas
app.register(authRoutes);
app.register(sedesRoutes);
app.register(disciplinesRoutes);
app.register(eventsRoutes);
app.register(challengesRoutes);
app.register(profileRoutes);
app.register(socialRoutes);

// Arranque
const PORT = Number(process.env.PORT) || 3000;

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  console.log(`\n🚀  DAN'S API corriendo en http://localhost:${PORT}\n`);
});
