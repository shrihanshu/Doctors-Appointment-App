import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("API Route - Received body:", body);
    
    const { role, specialty, experience, credentialUrl, description } = body;
    const user = await currentUser();
    
    console.log("API Route - Current user:", user);

    if (!user) {
      console.log("API Route - No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user in our database
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    console.log("API Route - Database user:", dbUser);

    if (!dbUser) {
      console.log("API Route - User not found in database");
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
      console.log("API Route - Invalid role:", role);
      return NextResponse.json({ error: "Invalid role selection" }, { status: 400 });
    }

    try {
      // For patient role - simple update
      if (role === "PATIENT") {
        console.log("API Route - Updating user to PATIENT role");
        
        await db.user.update({
          where: {
            clerkUserId: user.id,
          },
          data: {
            role: "PATIENT",
          },
        });

        console.log("API Route - Successfully updated user to PATIENT");
        return NextResponse.json({ 
          success: true, 
          redirect: "/doctors" 
        });
      }

      // For doctor role - need additional information
      if (role === "DOCTOR") {
        console.log("API Route - Processing DOCTOR role");
        
        // Validate inputs
        if (!specialty || !experience || !credentialUrl || !description) {
          console.log("API Route - Missing required fields for doctor");
          return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        await db.user.update({
          where: {
            clerkUserId: user.id,
          },
          data: {
            role: "DOCTOR",
            specialty,
            experience,
            credentialUrl,
            description,
            verificationStatus: "PENDING",
          },
        });

        console.log("API Route - Successfully updated user to DOCTOR");
        return NextResponse.json({ 
          success: true, 
          redirect: "/doctor/verification" 
        });
      }
    } catch (error) {
      console.error("API Route - Database error:", error);
      return NextResponse.json(
        { error: `Failed to update user profile: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Route - General error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 