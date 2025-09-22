import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const sessionRes = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    
    if (!sessionRes.ok) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const session = await sessionRes.json();
    
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin users can view statistics' },
        { status: 403 }
      );
    }

    // Get counts and statistics
    const [
      totalUsers,
      totalEcosystems,
      totalPlatforms,
      activeEcosystems,
      platformsWithCredentials,
      totpEnabledPlatforms,
      themes,
      platformTypes
    ] = await Promise.all([
      prisma.user.count(),
      prisma.ecosystem.count(),
      prisma.socialMediaPlatform.count(),
      prisma.ecosystem.count({ where: { active_status: true } }),
      prisma.socialMediaPlatform.count({
        where: {
          OR: [
            { username: { not: null } },
            { password: { not: null } }
          ]
        }
      }),
      prisma.socialMediaPlatform.count({ where: { totp_enabled: true } }),
      prisma.ecosystem.groupBy({
        by: ['theme'],
        _count: true,
        orderBy: { _count: { theme: 'desc' } }
      }),
      prisma.socialMediaPlatform.groupBy({
        by: ['platform_type'],
        _count: true,
        orderBy: { _count: { platform_type: 'desc' } }
      })
    ]);

    // Standard platforms list
    const standardPlatformTypes = [
      "YouTube", "Facebook", "Instagram", "Twitter/X", "TikTok",
      "Pinterest", "LinkedIn", "Bluesky", "Threads", "Reddit",
      "Blogspot", "Mastodon", "Telegram", "Nostr", "Lemmy",
      "Warpcast", "Twitch", "DLive", "Trovo", "Kick",
      "Rumble", "WhatsApp Channel", "Medium", "Quora", "Discord"
    ];

    // Count active standard platforms by checking platform names
    const allPlatforms = await prisma.socialMediaPlatform.findMany({
      select: {
        platform_name: true,
        platform_type: true
      }
    });
    
    const platformCounts: Record<string, number> = {};
    standardPlatformTypes.forEach(type => {
      platformCounts[type] = 0;
    });
    
    // Count platforms based on platform_name matching
    allPlatforms.forEach(platform => {
      for (const standardPlatform of standardPlatformTypes) {
        if (platform.platform_name.includes(standardPlatform)) {
          platformCounts[standardPlatform]++;
          break;
        }
      }
    });
    
    const activePlatformCounts = standardPlatformTypes.map(platformType => ({
      platform: platformType,
      count: platformCounts[platformType]
    }));
    
    const activeStandardPlatforms = activePlatformCounts.filter(p => p.count > 0);

    // Get platform-ecosystem matrix data
    const ecosystemsWithPlatforms = await prisma.ecosystem.findMany({
      include: {
        platforms: {
          select: {
            id: true,
            platform_type: true,
            platform_name: true,
            username: true,
            password: true,
            totp_enabled: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Create matrix data
    const matrix = ecosystemsWithPlatforms.map(ecosystem => {
      const platformMap: Record<string, {
        configured: boolean;
        hasCredentials: boolean;
        totpEnabled: boolean;
        count: number;
      }> = {};
      
      // Initialize all standard platforms as not configured
      standardPlatformTypes.forEach(platformType => {
        platformMap[platformType] = {
          configured: false,
          hasCredentials: false,
          totpEnabled: false,
          count: 0
        };
      });
      
      // Mark configured platforms
      ecosystem.platforms.forEach(platform => {
        // Check if platform_name contains any of the standard platform names
        let matchedPlatformType: string | null = null;
        
        for (const standardPlatform of standardPlatformTypes) {
          if (platform.platform_name.includes(standardPlatform)) {
            matchedPlatformType = standardPlatform;
            break;
          }
        }
        
        // If no match on platform_name, try to match platform_type to known mappings
        if (!matchedPlatformType) {
          const typeMapping: Record<string, string> = {
            'Video': 'YouTube',
            'Social Network': 'Facebook',
            'Microblogging': 'Twitter/X',
            'Professional Network': 'LinkedIn',
            'Photo Sharing': 'Instagram',
            'Short Video': 'TikTok',
            'Publishing': 'Medium',
            'Q&A Platform': 'Quora'
          };
          
          if (typeMapping[platform.platform_type]) {
            // Check if this platform name contains the mapped platform
            const mappedPlatform = typeMapping[platform.platform_type];
            if (platform.platform_name.includes(mappedPlatform)) {
              matchedPlatformType = mappedPlatform;
            }
          }
        }
        
        if (matchedPlatformType && platformMap[matchedPlatformType]) {
          const hasCredentials = !!(platform.username || platform.password);
          platformMap[matchedPlatformType] = {
            configured: true,
            hasCredentials,
            totpEnabled: platform.totp_enabled,
            count: platformMap[matchedPlatformType].count + 1
          };
        }
      });
      
      // Count configured standard platforms
      let totalConfigured = 0;
      Object.values(platformMap).forEach((platform) => {
        if (platform.configured) {
          totalConfigured++;
        }
      });
      
      return {
        ecosystemId: ecosystem.id,
        ecosystemName: ecosystem.name,
        ecosystemTheme: ecosystem.theme,
        activeStatus: ecosystem.active_status,
        platforms: platformMap,
        totalConfigured
      };
    });

    return NextResponse.json({
      summary: {
        totalUsers,
        totalEcosystems,
        activeEcosystems,
        totalPlatforms,
        platformsWithCredentials,
        totpEnabledPlatforms,
      },
      themes: themes.map(t => ({
        name: t.theme,
        count: t._count
      })),
      platformTypes: platformTypes.map(p => ({
        type: p.platform_type,
        count: p._count
      })),
      activeStandardPlatforms,
      standardPlatformTypes,
      matrix
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}