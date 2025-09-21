import { 
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Music2,
  Linkedin,
  MessageCircle,
  Radio,
  Tv,
  Globe,
  FileText,
  MessageSquare,
  Users,
  Wifi
} from "lucide-react";

export interface PlatformConfig {
  name: string;
  type: string;
  url: string;
  icon?: any;
  color?: string;
}

export const PLATFORM_CONFIGS: PlatformConfig[] = [
  { name: 'YouTube', type: 'video', url: 'https://www.youtube.com/signup', icon: Youtube, color: '#FF0000' },
  { name: 'Facebook', type: 'social', url: 'https://www.facebook.com/r.php', icon: Facebook, color: '#1877F2' },
  { name: 'Instagram', type: 'social', url: 'https://www.instagram.com/accounts/emailsignup/', icon: Instagram, color: '#E4405F' },
  { name: 'Twitter (X)', type: 'social', url: 'https://twitter.com/i/flow/signup', icon: Twitter, color: '#000000' },
  { name: 'TikTok', type: 'video', url: 'https://www.tiktok.com/signup', icon: Music2, color: '#000000' },
  { name: 'Pinterest', type: 'social', url: 'https://www.pinterest.com/join/', icon: Globe, color: '#E60023' },
  { name: 'LinkedIn', type: 'professional', url: 'https://www.linkedin.com/signup', icon: Linkedin, color: '#0A66C2' },
  { name: 'Bluesky', type: 'social', url: 'https://bsky.app/', icon: Globe, color: '#00A8E8' },
  { name: 'Threads', type: 'social', url: 'https://www.threads.net/login', icon: MessageCircle, color: '#000000' },
  { name: 'Reddit', type: 'forum', url: 'https://www.reddit.com/register/', icon: MessageSquare, color: '#FF4500' },
  { name: 'Blogspot', type: 'blog', url: 'https://www.blogger.com/about/', icon: FileText, color: '#F57C00' },
  { name: 'Mastodon', type: 'social', url: 'https://joinmastodon.org/', icon: Globe, color: '#6364FF' },
  { name: 'Telegram', type: 'messaging', url: 'https://web.telegram.org/a/', icon: MessageCircle, color: '#0088CC' },
  { name: 'Nostr', type: 'decentralized', url: 'https://nostr.com/', icon: Wifi, color: '#9B59B6' },
  { name: 'Lemmy', type: 'forum', url: 'https://join-lemmy.org/', icon: Users, color: '#00C853' },
  { name: 'Warpcast', type: 'decentralized', url: 'https://warpcast.com/', icon: Globe, color: '#472A91' },
  { name: 'Twitch', type: 'streaming', url: 'https://www.twitch.tv/signup', icon: Tv, color: '#9146FF' },
  { name: 'DLive', type: 'streaming', url: 'https://dlive.tv/s/', icon: Radio, color: '#FFD300' },
  { name: 'Trovo', type: 'streaming', url: 'https://trovo.live/signup', icon: Tv, color: '#19D66B' },
  { name: 'Kick', type: 'streaming', url: 'https://kick.com/signup', icon: Radio, color: '#53FC18' },
  { name: 'Rumble', type: 'video', url: 'https://rumble.com/register.php', icon: Youtube, color: '#74CC14' },
  { name: 'WhatsApp Channel', type: 'messaging', url: 'https://www.whatsapp.com/channel/', icon: MessageCircle, color: '#25D366' },
  { name: 'Medium', type: 'blog', url: 'https://medium.com/m/signin', icon: FileText, color: '#000000' },
  { name: 'Quora', type: 'forum', url: 'https://www.quora.com/signup', icon: MessageSquare, color: '#AA2200' },
  { name: 'Discord', type: 'messaging', url: 'https://discord.com/register', icon: MessageCircle, color: '#5865F2' },
];

export function getPlatformConfig(platformName: string): PlatformConfig | undefined {
  return PLATFORM_CONFIGS.find(config => config.name === platformName);
}