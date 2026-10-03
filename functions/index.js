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
 * Inclui o campo 'username' (parte antes do @)
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const username = user.email ? user.email.split('@')[0] : 'user';

    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      username: username,
      nome: '',
      bio: '',
      fotoURL: '',
      role: 'aluno',
      banido: false,
      emailVerificado: false,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Perfil criado para ${user.email} (username: ${username})`);
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
      const postRef = db.collection('posts').doc(alvoId);
      const comentsSnap = await postRef.collection('comentarios').get();
      const batch = db.batch();
      comentsSnap.docs.forEach((c) => batch.delete(c.ref));
      batch.delete(postRef);
      await batch.commit();
      console.log(`🗑️ Admin ${callerUid} apagou post ${alvoId}`);
    } else if (tipo === 'comentario') {
      const comentRef = db
        .collection('posts')
        .doc(postId)
        .collection('comentarios')
        .doc(alvoId);
      await comentRef.delete();
      console.log(`🗑️ Admin ${callerUid} apagou comentário ${alvoId}`);
    } else if (tipo === 'resposta') {
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

/**
 * 7) MIGRAÇÃO ONE-TIME
 * Adiciona 'username' a utilizadores existentes (criados antes desta mudança).
 * Só pode ser chamada por um admin.
 */
exports.migrarUsernames = functions.https.onCall(async (data, context) => {
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
      'Só admins podem correr a migração.'
    );
  }

  const usersRef = admin.firestore().collection('users');
  const snapshot = await usersRef.get();

  let atualizados = 0;
  let ignorados = 0;
  const batch = admin.firestore().batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.username && data.email) {
      const username = data.email.split('@')[0];
      batch.update(doc.ref, { username });
      atualizados++;
    } else {
      ignorados++;
    }
  });

  await batch.commit();

  console.log(`🔧 Migração: ${atualizados} atualizados, ${ignorados} ignorados`);

  return {
    success: true,
    atualizados,
    ignorados,
    total: snapshot.size,
  };
});
/**
 * 8) APAGAR CONTEÚDO (post ou reel)
 * Apaga de forma atómica:
 *   - Notificações relacionadas
 *   - Comentários (subcoleção)
 *   - Documento principal (posts/{id} ou reels/{id})
 *   - Ficheiros do Storage (imagens, vídeo, thumbnail)
 * 
 * Só o autor pode apagar.
 */
exports.apagarConteudo = functions.https.onCall(async (data, context) => {
  // 1. Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Tens de estar autenticado.'
    );
  }

  const callerUid = context.auth.uid;
  const { tipo, conteudoId } = data;

  // 2. Validar parâmetros
  if (!tipo || !conteudoId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'tipo e conteudoId são obrigatórios.'
    );
  }

  if (tipo !== 'post' && tipo !== 'reel') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'tipo deve ser "post" ou "reel".'
    );
  }

  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // 3. Verificar que o conteúdo existe e que o caller é o autor
  const colecao = tipo === 'post' ? 'posts' : 'reels';
  const docRef = db.collection(colecao).doc(conteudoId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Conteúdo não encontrado.'
    );
  }

  const docData = docSnap.data();
  if (docData.autorId !== callerUid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Só podes apagar o teu próprio conteúdo.'
    );
  }

  try {
    // 4. Apagar notificações relacionadas
    const notifsSnap = await db
      .collection('notifications')
      .where('postId', '==', conteudoId)
      .get();

    // 5. Se for post, apagar comentários (subcoleção)
    let comentsSnap = { docs: [] };
    if (tipo === 'post') {
      comentsSnap = await docRef.collection('comentarios').get();
    }

    // 6. Apagar ficheiros do Storage
    const ficheirosParaApagar = [];

    if (tipo === 'post') {
      // Apaga todas as imagens do post
      const imagens = docData.imagens || [];
      imagens.forEach((url) => {
        try {
          const path = decodeURIComponent(
            url.split('/o/')[1].split('?')[0]
          );
          ficheirosParaApagar.push(path);
        } catch (e) {
          console.warn('Erro ao extrair path da imagem:', url);
        }
      });
    } else if (tipo === 'reel') {
      // Apaga vídeo + thumbnail do reel
      if (docData.videoURL) {
        try {
          const path = decodeURIComponent(
            docData.videoURL.split('/o/')[1].split('?')[0]
          );
          ficheirosParaApagar.push(path);
        } catch (e) {}
      }
      if (docData.thumbURL) {
        try {
          const path = decodeURIComponent(
            docData.thumbURL.split('/o/')[1].split('?')[0]
          );
          ficheirosParaApagar.push(path);
        } catch (e) {}
      }
    }

    // 7. Apagar ficheiros do Storage
    if (ficheirosParaApagar.length > 0) {
      await Promise.all(
        ficheirosParaApagar.map(async (path) => {
          try {
            await bucket.file(path).delete();
          } catch (e) {
            // Ignora se já não existir
            console.warn(`Ficheiro ${path} não encontrado:`, e.message);
          }
        })
      );
    }

    // 8. Apagar com batch (atómico para Firestore)
    // Nota: Firestore batch tem limite de 500 operações
    // Se houver mais, dividimos em batches

    const todosParaApagar = [
      ...notifsSnap.docs.map((d) => d.ref),
      ...comentsSnap.docs.map((d) => d.ref),
      docRef,
    ];

    const BATCH_SIZE = 400;
    for (let i = 0; i < todosParaApagar.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = todosParaApagar.slice(i, i + BATCH_SIZE);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    console.log(
      `🗑️ ${callerUid} apagou ${tipo} ${conteudoId}. ` +
        `Notificações: ${notifsSnap.size}, Comentários: ${comentsSnap.size}, ` +
        `Ficheiros: ${ficheirosParaApagar.length}`
    );

    return {
      success: true,
      eliminados: {
        notificacoes: notifsSnap.size,
        comentarios: comentsSnap.size,
        ficheiros: ficheirosParaApagar.length,
      },
    };
  } catch (error) {
    console.error('Erro ao apagar conteúdo:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
      'internal',
      'Não foi possível apagar o conteúdo.'
    );
  }
});