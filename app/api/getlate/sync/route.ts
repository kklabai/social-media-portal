import { NextResponse } from "next/server";
import { getlateService } from "@/lib/services/getlate";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get all Getlate profiles
    const profiles = await getlateService.getProfiles();
    
    // Get all ecosystems from our database
    const ecosystems = await prisma.ecosystem.findMany({
      select: {
        id: true,
        name: true,
      }
    });

    // Create a mapping to match ecosystems with Getlate profiles
    const syncResults = {
      matched: [] as Array<{
        ecosystem_id: number;
        ecosystem_name: string;
        profile_id: string;
        profile_name: string;
        already_linked: boolean;
      }>,
      unmatched_ecosystems: [] as Array<{
        ecosystem_id: number;
        ecosystem_name: string;
      }>,
      unmatched_profiles: [] as Array<{
        profile_id: string;
        profile_name: string;
      }>,
    };

    // Try to match by name
    const ecosystemMap = new Map(ecosystems.map(eco => [eco.name.toLowerCase(), eco]));
    const profileMap = new Map(profiles.map(profile => [profile.name.toLowerCase(), profile]));

    // Find matches
    for (const [name, ecosystem] of ecosystemMap) {
      const profile = profileMap.get(name);
      if (profile) {
        syncResults.matched.push({
          ecosystem_id: ecosystem.id,
          ecosystem_name: ecosystem.name,
          profile_id: profile.id,
          profile_name: profile.name,
          already_linked: false, // Since we can't store the link in the database
        });

        // Note: Cannot update ecosystem with Getlate profile ID as the field doesn't exist in schema

        profileMap.delete(name);
      } else {
        syncResults.unmatched_ecosystems.push({
          ecosystem_id: ecosystem.id,
          ecosystem_name: ecosystem.name,
        });
      }
    }

    // Remaining profiles that don't match any ecosystem
    for (const [, profile] of profileMap) {
      syncResults.unmatched_profiles.push({
        profile_id: profile.id,
        profile_name: profile.name,
      });
    }

    return NextResponse.json({
      success: true,
      sync_results: syncResults,
      summary: {
        total_matched: syncResults.matched.length,
        total_unmatched_ecosystems: syncResults.unmatched_ecosystems.length,
        total_unmatched_profiles: syncResults.unmatched_profiles.length,
      },
    });
  } catch (error) {
    console.error("Error syncing with Getlate:", error);
    return NextResponse.json(
      { error: "Failed to sync with Getlate", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}