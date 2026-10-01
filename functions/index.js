const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * 1) BLOQUEAR registos fora do domínio @epfundao.edu.pt
 */
exports.beforecreated = functions.auth.user().beforeCreate((user, context) => {
  if (!user.email || !user.email.endsWith('@epfundao.edu.pt')) {
    throw new functions.auth.HttpsError(
      'invalid-argument',
      'Email não autorizado. Use um email @epfundao.edu.pt'
    );
  }
});

/**
 * 2) CRIAR PERFIL no Firestore quando uma conta é criada
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      nome: '',
      bio: '',
      fotoURL: '',
      role: 'aluno',
      banido: false,
      emailVerificado: false,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Perfil criado para ${user.email}`);
  } catch (error) {
    console.error('❌ Erro ao criar perfil:', error);
  }
});

/**
 * 3) PROMOVER PRIMEIRO ADMIN
 * Só funciona se ainda não existir nenhum admin.
 */
exports.promoverPrimeiroAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Tens de estar autenticado.'
    );
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email;

  const adminsSnapshot = await admin
    .firestore()
    .collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();

  if (!adminsSnapshot.empty) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Já existe um admin. Pede a esse admin para te promover.'
    );
  }

  if (!email || !email.endsWith('@epfundao.edu.pt')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Email inválido.'
    );
  }

  await admin.firestore().collection('users').doc(uid).update({
    role: 'admin',
  });

  console.log(`👑 Primeiro admin criado: ${email} (${uid})`);

  return {
    success: true,
    message: 'Foste promovido a admin com sucesso!',
  };
});

/**
 * 4) PROMOVER UTILIZADOR
 * Só pode ser chamada por um admin existente.
 */
exports.promoverUtilizador = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Tens de estar autenticado.'
    );
  }

  const callerUid = context.auth.uid;

  const callerSnap = await admin
    .firestore()
    .collection('users')
    .doc(callerUid)
    .get();

  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Só admins podem promover utilizadores.'
    );
  }

  const { targetUid, novoRole } = data;
  const rolesValidos = ['aluno', 'professor', 'admin'];

  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'targetUid inválido.'
    );
  }

  if (!rolesValidos.includes(novoRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'novoRole inválido. Deve ser: aluno, professor ou admin.'
    );
  }

  if (targetUid === callerUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Não podes alterar o teu próprio role.'
    );
  }

  await admin.firestore().collection('users').doc(targetUid).update({
    role: novoRole,
  });

  console.log(`✅ ${callerUid} promoveu ${targetUid} para ${novoRole}`);

  return {
    success: true,
    message: `Utilizador atualizado para ${novoRole}.`,
  };
});

/**
 * 5) BANIR / DESBANIR utilizador
 * Se banir === true → apaga posts + comentários + follows do utilizador.
 */
exports.banirUtilizador = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Tens de estar autenticado.'
    );
  }

  const callerUid = context.auth.uid;
  const callerSnap = await admin
    .firestore()
    .collection('users')
    .doc(callerUid)
    .get();

  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Só admins.');
  }

  const { targetUid, banir } = data;

  if (!targetUid || typeof banir !== 'boolean') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Parâmetros inválidos.'
    );
  }

  if (targetUid === callerUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Não podes banir-te a ti próprio.'
    );
  }

  const db = admin.firestore();

  if (banir) {
    // Apagar posts do utilizador (e comentários dentro deles)
    const postsSnap = await db
      .collection('posts')
      .where('autorId', '==', targetUid)
      .get();

    for (const postDoc of postsSnap.docs) {
      const comentsSnap = await postDoc.ref.collection('comentarios').get();
      const batch1 = db.batch();
      comentsSnap.docs.forEach((c) => batch1.delete(c.ref));
      batch1.delete(postDoc.ref);
      await batch1.commit();
    }

    // Apagar comentários feitos pelo utilizador em posts de outros
    const allPosts = await db.collection('posts').get();
    for (const postDoc of allPosts.docs) {
      const comentsSnap = await postDoc.ref
        .collection('comentarios')
        .where('autorId', '==', targetUid)
        .get();
      if (!comentsSnap.empty) {
        const batch2 = db.batch();
        comentsSnap.docs.forEach((c) => batch2.delete(c.ref));
        await batch2.commit();
      }
    }

    // Apagar follows
    const followsA = await db
      .collection('follows')
      .where('followerId', '==', targetUid)
      .get();
    const followsB = await db
      .collection('follows')
      .where('followedId', '==', targetUid)
      .get();
    const batch3 = db.batch();
    followsA.docs.forEach((f) => batch3.delete(f.ref));
    followsB.docs.forEach((f) => batch3.delete(f.ref));
    await batch3.commit();

    console.log(
      `🚫 Banido: apagados ${postsSnap.size} posts do utilizador ${targetUid}`
    );
  }

  // Marcar como banido
  await db.collection('users').doc(targetUid).update({ banido: banir });

  console.log(`${banir ? '🚫 Baniu' : '✅ Desbaniu'} ${targetUid}`);
  return { success: true };
});

/**
 * 6) REMOVER CONTEÚDO
 * Remove um post, comentário ou resposta (só admin).
 */
exports.removerConteudo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Tens de estar autenticado.'
    );
  }

  const callerUid = context.auth.uid;
  const callerSnap = await admin
    .firestore()
    .collection('users')
    .doc(callerUid)
    .get();

  if (!callerSnap.exists || callerSnap.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Só admins podem remover conteúdo.'
    );
  }

  const { tipo, alvoId, postId, respostaId } = data;

  if (!tipo || !alvoId || !postId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Parâmetros inválidos.'
    );
  }

  const db = admin.firestore();

  try {
    if (tipo === 'post') {
      // Apagar post + todos os seus comentários
      const postRef = db.collection('posts').doc(alvoId);
      const comentsSnap = await postRef.collection('comentarios').get();
      const batch = db.batch();
      comentsSnap.docs.forEach((c) => batch.delete(c.ref));
      batch.delete(postRef);
      await batch.commit();
      console.log(`🗑️ Admin ${callerUid} apagou post ${alvoId}`);
    } else if (tipo === 'comentario') {
      // Apagar comentário específico
      const comentRef = db
        .collection('posts')
        .doc(postId)
        .collection('comentarios')
        .doc(alvoId);
      await comentRef.delete();
      console.log(`🗑️ Admin ${callerUid} apagou comentário ${alvoId}`);
    } else if (tipo === 'resposta') {
      // Apagar resposta específica (array dentro do comentário)
      if (!respostaId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'respostaId obrigatório para tipo=resposta.'
        );
      }

      const comentRef = db
        .collection('posts')
        .doc(postId)
        .collection('comentarios')
        .doc(alvoId);

      const comentSnap = await comentRef.get();
      if (!comentSnap.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Comentário não encontrado.'
        );
      }

      const respostas = comentSnap.data().respostas || [];
      const novasRespostas = respostas.filter((r) => r.id !== respostaId);

      await comentRef.update({ respostas: novasRespostas });
      console.log(`🗑️ Admin ${callerUid} apagou resposta ${respostaId}`);
    } else {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Tipo inválido: ' + tipo
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao remover:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
      'internal',
      'Não foi possível remover o conteúdo.'
    );
  }
});