import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }) });

const CDN = 'https://cdn.prod.website-files.com/64a27c8ac2fc673da3530dd8';

async function main() {
  console.log('🌱  Seeding DAN\'S database...');

  // Sedes
  const centro = await prisma.sede.upsert({ where: { id: 'sede-centro' }, update: {}, create: {
    id: 'sede-centro', name: 'Madrid Centro', area: 'Malasaña', city: 'Madrid',
    address: 'Calle Fuencarral 88', distance: '1.2 km', studios: 4,
    gradFrom: '#FFB5C8', gradTo: '#FF6B6B',
  }});
  const norte = await prisma.sede.upsert({ where: { id: 'sede-norte' }, update: {}, create: {
    id: 'sede-norte', name: 'Madrid Norte', area: 'Chamartín', city: 'Madrid',
    distance: '4.8 km', studios: 3, gradFrom: '#F4C87A', gradTo: '#FFB5C8',
  }});
  const sur = await prisma.sede.upsert({ where: { id: 'sede-sur' }, update: {}, create: {
    id: 'sede-sur', name: 'Madrid Sur', area: 'La Latina', city: 'Madrid',
    distance: '2.6 km', studios: 2, gradFrom: '#FF8A6B', gradTo: '#F4C87A',
  }});
  const bcn = await prisma.sede.upsert({ where: { id: 'sede-bcn' }, update: {}, create: {
    id: 'sede-bcn', name: 'Barcelona Born', area: 'Born', city: 'Barcelona',
    studios: 3, gradFrom: '#FFB5C8', gradTo: '#D88BB5',
  }});

  // Disciplinas
  const disciplines = [
    { id: 'disc-broadway', name: 'Broadway', emoji: '🎭', desc: 'Musical, expresivo, narrativo. Cuenta historias con tu cuerpo.', level: 'Todos los niveles', duration: '60 min', gradFrom: '#FFB5C8', gradTo: '#FF6B6B', imageUrl: `${CDN}/68ef8bc0e48d8ffcdbd3a5c6_testimonial-video-thumb-ana.jpg` },
    { id: 'disc-power',    name: 'Power',    emoji: '💥', desc: 'Coreografías intensas y enérgicas. Para sentirte invencible.',    level: 'Intermedio',        duration: '45 min', gradFrom: '#FF6B6B', gradTo: '#F4C87A', imageUrl: `${CDN}/68ef8bb872b03f9023c86dd5_testimonial-video-thumb-caro.jpg` },
    { id: 'disc-groove',   name: 'Groove',   emoji: '🪩', desc: 'Ritmo, soul, fluidez. La sesión que te pone de buen humor.',     level: 'Todos los niveles', duration: '60 min', gradFrom: '#F4C87A', gradTo: '#FFB5C8', imageUrl: `${CDN}/68ef8bb3952f3ea05f8f7ea1_testimonial-video-thumb-carmen.jpg` },
    { id: 'disc-salsa',    name: 'Salsa',    emoji: '💃', desc: 'Pasos, sabor y mucho swing latino en pareja o sola.',            level: 'Todos los niveles', duration: '75 min', gradFrom: '#FF8A6B', gradTo: '#FFB5C8', imageUrl: `${CDN}/68ef8bae4f99663f05e81d16_testimonial-video-thumb-paloma.jpg` },
    { id: 'disc-bachata',  name: 'Bachata',  emoji: '🌹', desc: 'Sensual y conectada. Aprende a sentir cada compás.',             level: 'Todos los niveles', duration: '75 min', gradFrom: '#D88BB5', gradTo: '#F4C87A', imageUrl: `${CDN}/68ef8b9eb4d43860ba37a03e_testimonial-video-thumb-juliana.jpg` },
    { id: 'disc-heels',    name: 'Heels',    emoji: '👠', desc: 'Sensualidad y poder en tacones. Sin pose, todo actitud.',        level: 'Intermedio',        duration: '60 min', gradFrom: '#FF6B6B', gradTo: '#D88BB5', imageUrl: `${CDN}/68ef8b82530b1791a34a41c9_testimonial-video-thumb-rosa.jpg` },
  ];

  for (const d of disciplines) {
    await prisma.discipline.upsert({ where: { id: d.id }, update: {}, create: d });
  }

  // Instructoras
  const andrea = await prisma.instructor.upsert({ where: { id: 'inst-andrea' }, update: {}, create: {
    id: 'inst-andrea', name: 'Andrea Pérez', rating: 4.9,
    photoUrl: `${CDN}/65f87b3e358bd220df9e511b_martina-teacher-dans.jpg`,
    bio: 'Especialista en Broadway y Heels. 8 años de experiencia.',
  }});
  const diego = await prisma.instructor.upsert({ where: { id: 'inst-diego' }, update: {}, create: {
    id: 'inst-diego', name: 'Diego Ramos', rating: 4.8,
    photoUrl: `${CDN}/67a4c4349de0bce6a3e8201d_Alejandro1.webp`,
    bio: 'Instructor de Power y Groove. Coreógrafo profesional.',
  }});
  const lucia = await prisma.instructor.upsert({ where: { id: 'inst-lucia' }, update: {}, create: {
    id: 'inst-lucia', name: 'Lucía García', rating: 5.0,
    photoUrl: `${CDN}/677c1606295746a34768b81d_Alba-main.webp`,
    bio: 'Groove y Salsa. La energía que necesitas los sábados.',
  }});
  const roberto = await prisma.instructor.upsert({ where: { id: 'inst-roberto' }, update: {}, create: {
    id: 'inst-roberto', name: 'Roberto Sosa', rating: 4.9,
    photoUrl: `${CDN}/6703fff57fe7b4f15e15c570_1R9A6995-Editar.jpg`,
    bio: 'Bachata y Salsa. Más de 10 años bailando en Madrid.',
  }});

  // Eventos (próxima semana)
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  const events = [
    { id: 'evt-1', title: 'Broadway Night: Chicago', disciplineId: 'disc-broadway', instructorId: andrea.id, sedeId: centro.id, studio: 'Sala 1', spots: 24, startsAt: new Date(base.getTime() + 2*86400000 + 19.5*3600000), imageUrl: `${CDN}/68ef8bc0e48d8ffcdbd3a5c6_testimonial-video-thumb-ana.jpg`, description: 'Una clase única inspirada en el musical Chicago. Coreografía completa de "All That Jazz" en un ambiente de cabaret.' },
    { id: 'evt-2', title: 'Sunset Power Mix',        disciplineId: 'disc-power',    instructorId: diego.id,   sedeId: norte.id, studio: 'Sala 2', spots: 20, startsAt: new Date(base.getTime() + 3*86400000 + 20*3600000),   imageUrl: `${CDN}/68ef8bb872b03f9023c86dd5_testimonial-video-thumb-caro.jpg`,   description: 'La sesión más enérgica de la semana, con luces de atardecer y mucho movimiento.' },
    { id: 'evt-3', title: 'Groove Brunch',           disciplineId: 'disc-groove',   instructorId: lucia.id,   sedeId: centro.id, studio: 'Sala 3', spots: 25, startsAt: new Date(base.getTime() + 4*86400000 + 11*3600000),   imageUrl: `${CDN}/68ef8bb3952f3ea05f8f7ea1_testimonial-video-thumb-carmen.jpg`, description: 'Empezamos el sábado con groove y nos quedamos a desayunar juntas. Buen rollo y café incluido.' },
    { id: 'evt-4', title: 'Bachata Social',          disciplineId: 'disc-bachata',  instructorId: roberto.id, sedeId: sur.id,    studio: 'Sala Principal', spots: 40, startsAt: new Date(base.getTime() + 4*86400000 + 21*3600000), imageUrl: `${CDN}/68ef8bae4f99663f05e81d16_testimonial-video-thumb-paloma.jpg`, description: 'Noche social después de clase. Aprendemos en la primera hora y luego bailamos hasta la medianoche.' },
    { id: 'evt-5', title: 'Heels & Champagne',       disciplineId: 'disc-heels',    instructorId: andrea.id,  sedeId: centro.id, studio: 'Sala 1', spots: 18, startsAt: new Date(base.getTime() + 5*86400000 + 18.5*3600000), imageUrl: `${CDN}/68ef8b82530b1791a34a41c9_testimonial-video-thumb-rosa.jpg`,   description: 'Clase exclusiva con coreo de altísimo nivel y copa de despedida.' },
  ];

  for (const e of events) {
    await prisma.event.upsert({ where: { id: e.id }, update: {}, create: { ...e, status: 'published' } });
  }

  // Badges
  const badges = [
    { id: 'badge-1', name: 'Primer Paso',   emoji: '🌱', condition: 'first_class' },
    { id: 'badge-2', name: 'Racha 7 días',  emoji: '🔥', condition: 'streak_7' },
    { id: 'badge-3', name: 'Broadway Lover',emoji: '🎭', condition: 'broadway_3' },
    { id: 'badge-4', name: 'Social Star',   emoji: '💃', condition: 'events_5' },
    { id: 'badge-5', name: 'Mes Completo',  emoji: '🌸', condition: 'challenge_complete' },
    { id: 'badge-6', name: 'Racha 30 días', emoji: '🏅', condition: 'streak_30' },
    { id: 'badge-7', name: 'Todo Estrenos', emoji: '✨', condition: 'new_disciplines_4' },
    { id: 'badge-8', name: 'Embajadora',    emoji: '👑', condition: 'referrals_3' },
    { id: 'badge-9', name: 'Wrapped Anual', emoji: '🎁', condition: 'year_complete' },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({ where: { id: b.id }, update: {}, create: b });
  }

  // Reto activo
  const now = new Date();
  await prisma.challenge.upsert({ where: { id: 'ch-1' }, update: {}, create: {
    id: 'ch-1',
    title: 'Mes del Movimiento',
    subtitle: '12 clases en 30 días',
    description: 'Mantén el ritmo este mes y desbloquea tu badge dorado.',
    emoji: '🌸',
    goal: 12,
    reward: 'Badge dorado + descuento 20%',
    startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
    endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    active: true,
  }});

  // Usuario demo
  const hash = await bcrypt.hash('dans2025', 10);
  await prisma.user.upsert({ where: { email: 'lucia@dans.es' }, update: {}, create: {
    email: 'lucia@dans.es',
    passwordHash: hash,
    name: 'Lucía',
    role: 'member',
    profile: {
      create: {
        sedeId: centro.id,
        streak: 12,
        totalClasses: 47,
      },
    },
  }});

  console.log('✅  Seed completado.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
