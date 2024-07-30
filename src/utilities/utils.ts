import crypto from 'crypto';
import jwtDecode from 'jwt-decode';


const algorithm = 'aes-256-ctr';
const secretKey = process.env.SECRET_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

export const encodeToken = (token: string): string => {
  console.log('Token to encrypt:', token);

  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  // console.log('Cipher:', cipher);

  const encryptedToken = Buffer.concat([cipher.update(token), cipher.final()]);
  // console.log('Encrypted Token Buffer:', encryptedToken);

  const result = `${iv.toString('hex')}:${encryptedToken.toString('hex')}`;
  // console.log('Encoded Token:', result);

  return result;
};

export const decodeToken = (encodedToken: string): string => {
  // console.log('Encoded Token to decrypt:', encodedToken);

  const [ivHex, encryptedTokenHex] = encodedToken.split(':');
  // console.log('IV Hex:', ivHex);
  // console.log('Encrypted Token Hex:', encryptedTokenHex);

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedToken = Buffer.from(encryptedTokenHex, 'hex');
  // console.log('IV Buffer:', iv);
  // console.log('Encrypted Token Buffer:', encryptedToken);

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  // console.log('Decipher:', decipher);

  const decryptedToken = Buffer.concat([decipher.update(encryptedToken), decipher.final()]);
  // console.log('Decrypted Token Buffer:', decryptedToken);

  const result = decryptedToken.toString();
  console.log('Decoded Token:', result);

  return result;
};




export function convertToUTC(date: string, time: string, timeZone: string): string {
  const localDateTime = new Date(`${date}T${time}:00`);
  const utcDateTime = new Date(localDateTime.toLocaleString('en-US', { timeZone }));
  return utcDateTime.toISOString();
}