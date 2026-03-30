/**
 * Precomputed PBKDF2-SHA256 (210k iterations) hashes per demo user.
 * Password and account emails are documented only in the project README.
 */
export interface DemoCredential {
  userId: string;
  /** Lowercase email; login normalizes input to this form. */
  email: string;
  saltB64: string;
  hashB64: string;
}

export const DEMO_CREDENTIALS: readonly DemoCredential[] = [
  {
    userId: 'u-sipho',
    email: 'civicalert.demo.sipho@gmail.com',
    saltB64: '29PV8RNdTnUu1GVvitrQIw==',
    hashB64: 'Ed8cnqO36zTLsE/wE6oNLaSclOlW+/NCXlC532SrrRY='
  },
  {
    userId: 'u-thandi',
    email: 'civicalert.demo.thandi@gmail.com',
    saltB64: 'vMA4m++04HGUf0ZwJac9Yg==',
    hashB64: 'Ad++vZtEk02f/HLvlI3iPQSZzgw8dSR/I77gG3k33w4='
  },
  {
    userId: 'u-pieter',
    email: 'civicalert.demo.pieter@gmail.com',
    saltB64: 'QEhBC7SR5J5oBmkjXGK1qg==',
    hashB64: 'sPo8IuGSB39rwyTCDd83P1OAdCG6e7CHkpVHbzkUyJY='
  },
  {
    userId: 'u-zahra',
    email: 'civicalert.demo.zahra@gmail.com',
    saltB64: 'gCqljtmKaHaZVenOMsNBVA==',
    hashB64: 'H6jYXtXEZWU3G2hHCow8CFilhuK4WvrkBaeODXW4Kx0='
  },
  {
    userId: 'u-kgotso',
    email: 'civicalert.demo.kgotso@gmail.com',
    saltB64: '3bPJqouk4qEmSm51zSE3bQ==',
    hashB64: 'JxcK58ZXWraDtnvBUTUvvpCUMgGLaWDZulY5FOA7Mhg='
  },
  {
    userId: 'u-lindiwe',
    email: 'civicalert.demo.lindiwe@gmail.com',
    saltB64: 'KRsXLLAxRnLJ1eIqShzkzA==',
    hashB64: '3UJIi8fbKTTJBhp83Gsbsv/UZdDyrX8vtggE4G+TVQU='
  },
  {
    userId: 'u-andre',
    email: 'civicalert.demo.andre@gmail.com',
    saltB64: 'Cl3SkIMvtzjVQnyQ6L1+PA==',
    hashB64: 'jqfbx0hrshMvhkdaybkXUdWPPjKRXRxL+2hoQD4zk+k='
  }
];

export function findDemoCredential(
  emailNormalized: string
): DemoCredential | undefined {
  return DEMO_CREDENTIALS.find((c) => c.email === emailNormalized);
}
