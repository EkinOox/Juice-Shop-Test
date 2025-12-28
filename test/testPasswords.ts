/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

/**
 * Centralized test password management
 * All passwords are loaded from environment variables with fallbacks for compatibility
 */

export const testPasswords = {
  jim: process.env.TEST_PASSWORD_JIM ?? 'ncc-1701',
  admin: process.env.TEST_PASSWORD_ADMIN ?? 'admin123',
  accountant: process.env.TEST_PASSWORD_ACCOUNTANT ?? 'i am an awesome accountant',
  kalli: process.env.TEST_PASSWORD_KALLI ?? 'kallliiii',
  otto: process.env.TEST_PASSWORD_OTTO ?? 'ooootto',
  support: process.env.TEST_PASSWORD_SUPPORT ?? 'J6aVjTgOpRs@?5l!Zkq2AYnCE@RF$P',
  mcSafesearch: process.env.TEST_PASSWORD_MC_SAFESEARCH ?? 'Mr. N00dles',
  amy: process.env.TEST_PASSWORD_AMY ?? 'K1f.....................',
  bender: process.env.TEST_PASSWORD_BENDER ?? 'EinBelegtesBrotMitSchinkenSCHINKEN!',
  bjoernOAuth: process.env.TEST_PASSWORD_BJOERN_OAUTH ?? 'bW9jLmxpYW1nQGhjaW5pbW1pay5ucmVvamI=',
  simple: process.env.TEST_PASSWORD_SIMPLE ?? '12345',
  horst: process.env.TEST_PASSWORD_HORST ?? 'hooooorst',
  generic: process.env.TEST_PASSWORD_GENERIC ?? 'does.not.matter',
  wurstbrot: process.env.TEST_PASSWORD_WURSTBROT ?? '0Y8rMnww$*9VFYEÂ§59-!Fg1L6t&6lB',
  twoFa: process.env.TEST_PASSWORD_2FA ?? '123456',
  benderDeluxe: process.env.TEST_PASSWORD_BENDER_DELUXE ?? 'OhG0dPlease1nsertLiquor!',
  ciso: process.env.TEST_PASSWORD_CISO ?? 'mDLx?94T~1CfVfZMzw@sJ9f?s3L6lbMqE70FfI8^54jbNikY5fymx7c!YbJb',
  masked: process.env.TEST_PASSWORD_MASKED ?? '********************************',
  twoFaSecret: process.env.TEST_PASSWORD_2FA_SECRET ?? 's3cr3t!',
  weak: process.env.TEST_PASSWORD_WEAK ?? 'aaaaa',
  password: process.env.TEST_HASH_PASSWORD_2 ?? 'password',
  space: process.env.TEST_PASSWORD_SPACE ?? ' ',
  spacePrefix: process.env.TEST_PASSWORD_SPACE_PREFIX ?? ' test',
  chatbotMnemonic: process.env.TEST_PASSWORD_CHATBOT_MNEMONIC ?? 'ship coffin krypt cross estate supply insurance asbestos souvenir',
  chatbotTest: process.env.TEST_PASSWORD_CHATBOT_TEST ?? 'testtesttest',
  erasure: process.env.TEST_PASSWORD_ERASURE ?? 'kitten lesser pooch karate buffoon indoors',
  kunigunde: process.env.TEST_PASSWORD_KUNIGUNDE ?? 'kunigunde',
  passphrase: process.env.TEST_PASSWORD_PASSPHRASE ?? 'monkey summer birthday are all bad passwords but work just fine in a long passphrase',
  demo: process.env.TEST_PASSWORD_DEMO ?? 'demo',
  
  // TOTP/2FA secrets
  totpSecretValid: process.env.TEST_TOTP_SECRET_VALID ?? 'IFTXE3SPOEYVURT2MRYGI52TKJ4HC3KH',
  totpSecretInvalid: process.env.TEST_TOTP_SECRET_INVALID ?? 'ASDVAJSDUASZGDIADBJS',
  oauthTest: process.env.TEST_PASSWORD_OAUTH_TEST ?? 'bW9jLnRzZXRAdHNldA==',
  hashMd5Admin123: process.env.TEST_HASH_MD5_ADMIN123 ?? '0192023a7bbd73250516f069df18b500',
  hashMd5Password: process.env.TEST_HASH_MD5_PASSWORD ?? '5f4dcc3b5aa765d61d8327deb882cf99',
  hashMd5Empty: process.env.TEST_HASH_MD5_EMPTY ?? 'd41d8cd98f00b204e9800998ecf8427e',
  hmacAdmin123: process.env.TEST_HMAC_ADMIN123 ?? '6be13e2feeada221f29134db71c0ab0be0e27eccfc0fb436ba4096ba73aafb20',
  hmacPassword: process.env.TEST_HMAC_PASSWORD ?? 'da28fc4354f4a458508a461fbae364720c4249c27f10fccf68317fc4bf6531ed',
  hmacEmpty: process.env.TEST_HMAC_EMPTY ?? 'f052179ec5894a2e79befa8060cfcb517f1e14f7f6222af854377b6481ae953e',
  continueCode: process.env.TEST_CONTINUE_CODE ?? 'yXjv6Z5jWJnzD6a3YvmwPRXK7roAyzHDde2Og19yEN84plqxkMBbLVQrDeoY',
  botBodyMd5: process.env.TEST_BOT_BODY_MD5 ?? '3be2e438b7f3d04c89d7749f727bb3bd',
  tokenValid: process.env.TEST_TOKEN_VALID ?? 'valid-token',
  tokenNew: process.env.TEST_TOKEN_NEW ?? 'newToken123',
  tokenGeneric: process.env.TEST_TOKEN_GENERIC ?? 'TOKEN',
  tokenValue: process.env.TEST_TOKEN_VALUE ?? 'tokenValue'
}
