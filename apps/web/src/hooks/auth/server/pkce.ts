import crypto from 'crypto';

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function createPkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const hashed = crypto.createHash('sha256').update(verifier).digest();
  const challenge = base64UrlEncode(hashed);
  return { verifier, challenge };
}
