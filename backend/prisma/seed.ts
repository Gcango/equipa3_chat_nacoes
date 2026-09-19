import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const alunoHash = await bcrypt.hash("Aluno123!", 10);

  await prisma.user.upsert({
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

  await prisma.user.upsert({
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

  const aluno = await prisma.user.findUnique({
    where: { email: "aluno.demo@epgerabriel.edu.pt" },
  });
  if (aluno) {
    const count = await prisma.post.count({ where: { authorId: aluno.id } });
    if (count === 0) {
      await prisma.post.create({
        data: {
          authorId: aluno.id,
          content: "Bem-vindos à Comunidade Digital Escolar — Chat_Nações!",
          type: "NOTICIA",
        },
      });
    }
  }

  console.log("Seed concluído (contas demo @epgerabriel.edu.pt).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
