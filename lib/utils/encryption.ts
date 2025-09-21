import CryptoJS from 'crypto-js';

// Use the key from .env.local or fallback for development
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'Cl063wfzL5wgJanhMl9BYDor0glySGhy%';

export function encrypt(text: string): string {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}