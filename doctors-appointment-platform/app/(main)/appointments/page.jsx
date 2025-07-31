"use client";

import { useEffect, useState } from "react";
import { AppointmentCard } from "@/components/appointment-card";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function PatientAppointmentsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user data
        const userResponse = await fetch('/api/user/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkUserId: clerkUser.id }),
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          if (userData.role !== "PATIENT") {
            router.push("/onboarding");
            return;
          }

          // Fetch appointments
          const appointmentsResponse = await fetch('/api/appointments/patient', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clerkUserId: clerkUser.id }),
          });

          if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            setAppointments(appointmentsData.appointments || []);
          } else {
            setError("Failed to fetch appointments");
          }
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while loading appointments");
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchData();
    }
  }, [clerkUser, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
        backLink="/doctors"
        backLabel="Find Doctors"
      />

      <Card className="border-emerald-900/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-emerald-400" />
            Your Scheduled Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-400">Error: {error}</p>
            </div>
          ) : appointments?.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole="PATIENT"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">
                No appointments scheduled
              </h3>
              <p className="text-muted-foreground">
                You don&apos;t have any appointments scheduled yet. Browse our
                doctors and book your first consultation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
