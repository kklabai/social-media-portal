import { NextRequest, NextResponse } from "next/server";
import { getlateService } from "@/lib/services/getlate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateFrom = searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('date_to') || new Date().toISOString().split('T')[0];

    // Get all ecosystems with their platforms
    const ecosystems = await prisma.ecosystem.findMany({
      where: {
        active_status: true,
      },
      include: {
        platforms: {
          select: {
            id: true,
            platform_name: true,
            platform_type: true,
            username: true,
          },
        },
      },
    });

    // Get Getlate stats if API key is configured
    let getlateStats: Awaited<ReturnType<typeof getlateService.getAllProfilesStats>> | null = null;
    if (process.env.GETLATE_API_KEY) {
      try {
        getlateStats = await getlateService.getAllProfilesStats(dateFrom, dateTo);
      } catch (error) {
        console.error("Error fetching Getlate stats:", error);
      }
    }

    // Build report data
    const report = ecosystems.map(ecosystem => {
      // Since getlate_profile_id doesn't exist in the schema, we'll match by ecosystem name
      const getlateProfile = getlateStats?.profiles.find(
        p => p.profile.name.toLowerCase() === ecosystem.name.toLowerCase()
      );

      const platformsReport = ecosystem.platforms.map(platform => {
        const platformStats = getlateProfile?.stats.find(
          s => s.platform.toLowerCase() === platform.platform_name.toLowerCase()
        );

        return {
          platform_id: platform.id,
          platform_name: platform.platform_name,
          platform_type: platform.platform_type,
          getlate_connected: !!platformStats,
          getlate_username: platform.username || null,
          posts_count: platformStats?.posts_count || 0,
        };
      });

      const totalPosts = platformsReport.reduce((sum, p) => sum + p.posts_count, 0);
      const connectedPlatforms = platformsReport.filter(p => p.getlate_connected).length;

      return {
        ecosystem_id: ecosystem.id,
        ecosystem_name: ecosystem.name,
        ecosystem_theme: ecosystem.theme,
        getlate_profile_id: getlateProfile?.profile.id || null,
        getlate_profile_name: getlateProfile?.profile.name,
        total_platforms: ecosystem.platforms.length,
        getlate_connected_platforms: connectedPlatforms,
        total_posts: totalPosts,
        platforms: platformsReport,
      };
    });

    // Calculate summary
    const summary = {
      total_ecosystems: ecosystems.length,
      ecosystems_with_getlate: report.filter(e => e.getlate_profile_id).length,
      total_platforms: report.reduce((sum, eco) => sum + eco.total_platforms, 0),
      getlate_connected_platforms: report.reduce((sum, eco) => sum + eco.getlate_connected_platforms, 0),
      total_posts: report.reduce((sum, eco) => sum + eco.total_posts, 0),
      date_range: {
        from: dateFrom,
        to: dateTo,
      },
    };

    return NextResponse.json({
      success: true,
      summary,
      ecosystems: report,
      getlate_available: !!process.env.GETLATE_API_KEY,
    });
  } catch (error) {
    console.error("Error generating Getlate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}