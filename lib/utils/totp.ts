import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TOTPSecret {
  secret: string;
  qrCodeUrl?: string;
}

export async function generateTOTPSecret(platformName: string, userEmail: string): Promise<TOTPSecret> {
  const secret = speakeasy.generateSecret({
    name: `${platformName} (${userEmail})`,
    length: 32,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCodeUrl,
  };
}

export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps for clock drift
  });
}

export function generateTOTPToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}