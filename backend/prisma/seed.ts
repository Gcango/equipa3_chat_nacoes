import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const alunoHash = await bcrypt.hash("Aluno123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin.demo@epgerabriel.edu.pt" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "admin.demo@epgerabriel.edu.pt",
      studentNumber: "ADMIN001",
      course: "Staff",
      classGroup: "—",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ATIVO",
    },
  });

  const aluno = await prisma.user.upsert({
    where: { email: "aluno.demo@epgerabriel.edu.pt" },
    update: {},
    create: {
      name: "Ana Aluno Demo",
      email: "aluno.demo@epgerabriel.edu.pt",
      studentNumber: "2026001",
      course: "12º Multimedia",
      classGroup: "12A",
      passwordHash: alunoHash,
      role: "ALUNO",
      status: "ATIVO",
      bio: "Conta fictícia para demonstração.",
    },
  });

  await prisma.user.upsert({
    where: { email: "pendente.demo@epgerabriel.edu.pt" },
    update: {},
    create: {
      name: "Pedro Pendente",
      email: "pendente.demo@epgerabriel.edu.pt",
      studentNumber: "2026002",
      course: "11º Informática",
      classGroup: "11B",
      passwordHash: alunoHash,
      role: "ALUNO",
      status: "PENDENTE",
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: "prof.demo@epgerabriel.edu.pt" },
    update: {},
    create: {
      name: "Prof. Miguel Costa",
      email: "prof.demo@epgerabriel.edu.pt",
      studentNumber: "PROF001",
      course: "Informática",
      classGroup: "—",
      passwordHash: alunoHash,
      role: "PROFESSOR",
      status: "ATIVO",
    },
  });

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: aluno.id,
          content: "Bem-vindos à Comunidade Digital Escolar — Chat_Nações!",
          type: "NOTICIA",
        },
        {
          authorId: aluno.id,
          content:
            "Dica: tudo o que publicares aqui fica visível para alunos e professores com conta activa.",
          type: "NORMAL",
        },
        {
          authorId: professor.id,
          content:
            "Relembramos a entrega dos relatórios de estágio até ao final do mês. Dúvidas na sala ou por mensagem.",
          type: "NOTICIA",
        },
        {
          authorId: admin.id,
          content:
            "Ambiente moderado: comunicação respeitosa. Usa «Denunciar» se vires conteúdo impróprio.",
          type: "NOTICIA",
        },
        {
          authorId: aluno.id,
          content:
            "Projecto final: plataforma de gestão escolar — partilhem ideias na turma e registem o progresso em Projetos.",
          type: "PROJETO",
        },
      ],
    });
  }

  const groupCount = await prisma.communityGroup.count();
  if (groupCount === 0) {
    const turma = await prisma.communityGroup.create({
      data: {
        name: "Turma 12A",
        description: "Turma de Multimedia — comunicação diária.",
      },
    });
    const info = await prisma.communityGroup.create({
      data: {
        name: "Informática / Programação",
        description: "Alunos e professores de informática.",
      },
    });
    const desporto = await prisma.communityGroup.create({
      data: {
        name: "Desporto & Fitness",
        description: "Eventos desportivos e treinos.",
      },
    });
    await prisma.groupMember.createMany({
      data: [
        { groupId: turma.id, userId: aluno.id },
        { groupId: info.id, userId: aluno.id },
      ],
    });
    void desporto;
  }

  const eventCount = await prisma.schoolEvent.count();
  if (eventCount === 0) {
    const now = new Date();
    const d = (days: number, h: number) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, h, 0, 0);
    await prisma.schoolEvent.createMany({
      data: [
        {
          title: "Torneio de Futsal",
          location: "Pavilhão",
          description: "Inter-turmas",
          startsAt: d(1, 16),
        },
        {
          title: "Feira de Cursos",
          location: "Átrio",
          description: "Apresentação de cursos profissionais",
          startsAt: d(5, 10),
        },
        {
          title: "Entrega de projectos",
          location: "Sala Informática",
          description: "Prazo final PAP",
          startsAt: d(12, 14),
        },
      ],
    });
  }

  const resourceCount = await prisma.resourceLink.count();
  if (resourceCount === 0) {
    await prisma.resourceLink.createMany({
      data: [
        {
          title: "Recursos da Escola",
          url: "https://www.epgerabriel.edu.pt",
          category: "Geral",
          description: "Site oficial GERABRIEL",
          sortOrder: 1,
        },
        {
          title: "Calendário Escolar",
          url: "https://www.epgerabriel.edu.pt",
          category: "Geral",
          description: "Datas lectivas e feriados",
          sortOrder: 2,
        },
        {
          title: "Biblioteca Digital",
          url: "https://www.epgerabriel.edu.pt",
          category: "Estudo",
          description: "Material de apoio",
          sortOrder: 3,
        },
        {
          title: "Diretório @epgerabriel.edu.pt",
          url: "mailto:secretaria@epgerabriel.edu.pt",
          category: "Contactos",
          description: "Secretaria escolar",
          sortOrder: 4,
        },
        {
          title: "Suporte / Ajuda",
          url: "mailto:suporte@epgerabriel.edu.pt",
          category: "Contactos",
          description: "Apoio técnico Chat_Nações",
          sortOrder: 5,
        },
      ],
    });
  }

  const msgCount = await prisma.directMessage.count({
    where: { OR: [{ senderId: aluno.id }, { recipientId: aluno.id }] },
  });
  if (msgCount === 0) {
    await prisma.directMessage.createMany({
      data: [
        {
          senderId: professor.id,
          recipientId: aluno.id,
          content: "Olá Ana! Não te esqueças de entregar o relatório do projecto até sexta.",
        },
        {
          senderId: admin.id,
          recipientId: aluno.id,
          content: "Bem-vinda à comunidade. Explora mensagens, grupos e calendário.",
        },
        {
          senderId: professor.id,
          recipientId: aluno.id,
          content: "Amanhã temos revisão do código às 15h00.",
        },
      ],
    });
  }

  const notifCount = await prisma.notification.count({ where: { userId: aluno.id } });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          userId: aluno.id,
          title: "Novo evento",
          body: "Torneio de Futsal — consulta o calendário.",
          href: "/calendario",
        },
        {
          userId: aluno.id,
          title: "Grupo Informática",
          body: "Foste adicionada ao grupo Informática / Programação.",
          href: "/grupos",
        },
        {
          userId: aluno.id,
          title: "Publicação no feed",
          body: "Há novidades na comunidade — vê o feed.",
          href: "/feed",
        },
        {
          userId: aluno.id,
          title: "Recursos actualizados",
          body: "Novos links na biblioteca digital.",
          href: "/recursos",
        },
        {
          userId: aluno.id,
          title: "Lembrete escolar",
          body: "Feira de Cursos na próxima semana.",
          href: "/calendario",
        },
        {
          userId: aluno.id,
          title: "Moderação",
          body: "Lembra-te: comunicação respeitosa na comunidade.",
          href: "/escola",
        },
        {
          userId: aluno.id,
          title: "Projectos",
          body: "Regista o progresso do teu projecto.",
          href: "/projetos",
        },
      ],
    });
  }

  console.log("Seed concluído (contas demo @epgerabriel.edu.pt).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
