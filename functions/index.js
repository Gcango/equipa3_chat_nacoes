const functions = require("firebase-functions/v1");

exports.beforecreated = functions.auth.user().beforeCreate((user, context) => {
  // Verifica se o email existe e termina com o domínio correto
  if (!user.email || !user.email.endsWith('@epfundao.edu.pt')) {
    throw new functions.auth.HttpsError(
      'invalid-argument',
      'Email não autorizado. Use um email @epfundao.edu.pt'
    );
  }
});