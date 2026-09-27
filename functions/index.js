const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Inicializar o Firebase Admin SDK (para escrever no Firestore)
admin.initializeApp();

/**
 * 1) BLOQUEAR registos fora do domínio @epfundao.edu.pt
 * Executa ANTES de a conta ser criada.
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
 * 2) CRIAR PERFIL no Firestore
 * Executa DEPOIS de a conta ser criada, automaticamente.
 * Cria o documento users/{uid} com dados iniciais.
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
      emailVerificado: false,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ Perfil criado para ${user.email} (uid: ${user.uid})`);
  } catch (error) {
    console.error('❌ Erro ao criar perfil:', error);
  }
});