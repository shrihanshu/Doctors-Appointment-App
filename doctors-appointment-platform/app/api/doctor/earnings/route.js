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

    // Calculate earnings
    const completedAppointments = await db.appointment.findMany({
      where: {
        doctorId: dbUser.id,
        status: "COMPLETED",
      },
    });

    const totalEarnings = completedAppointments.reduce((sum, appointment) => {
      return sum + (appointment.amount || 0);
    }, 0);

    const thisMonthEarnings = completedAppointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.updatedAt);
        const now = new Date();
        return appointmentDate.getMonth() === now.getMonth() && 
               appointmentDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, appointment) => {
        return sum + (appointment.amount || 0);
      }, 0);

    const earnings = {
      total: totalEarnings,
      thisMonth: thisMonthEarnings,
      totalAppointments: completedAppointments.length,
    };

    return NextResponse.json({ earnings });
  } catch (error) {
    console.error("Error fetching doctor earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 