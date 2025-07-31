import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { clerkUserId } = await request.json();
    const user = await currentUser();

    if (!user || user.id !== clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser || dbUser.role !== "DOCTOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch availability slots for the doctor
    const slots = await db.slot.findMany({
      where: {
        doctorId: dbUser.id,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 