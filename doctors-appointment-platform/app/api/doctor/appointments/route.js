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

    // Fetch appointments for the doctor
    const appointments = await db.appointment.findMany({
      where: {
        doctorId: dbUser.id,
      },
      include: {
        patient: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        slot: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 