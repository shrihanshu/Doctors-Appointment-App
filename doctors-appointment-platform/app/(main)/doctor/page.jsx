"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AvailabilitySettings } from "./_components/availability-settings";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Calendar, Clock, DollarSign } from "lucide-react";
import DoctorAppointmentsList from "./_components/appointments-list";
import { DoctorEarnings } from "./_components/doctor-earnings";

export default function DoctorDashboardPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [earnings, setEarnings] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
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

          // Redirect if not a doctor
          if (userData?.role !== "DOCTOR") {
            router.push("/onboarding");
            return;
          }

          // If not verified, redirect to verification
          if (userData?.verificationStatus !== "VERIFIED") {
            router.push("/doctor/verification");
            return;
          }

          // Fetch all doctor data
          const [appointmentsRes, availabilityRes, earningsRes, payoutsRes] = await Promise.all([
            fetch('/api/doctor/appointments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkUserId: clerkUser.id }),
            }),
            fetch('/api/doctor/availability', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkUserId: clerkUser.id }),
            }),
            fetch('/api/doctor/earnings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkUserId: clerkUser.id }),
            }),
            fetch('/api/doctor/payouts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clerkUserId: clerkUser.id }),
            }),
          ]);

          if (appointmentsRes.ok) {
            const appointmentsData = await appointmentsRes.json();
            setAppointments(appointmentsData.appointments || []);
          }

          if (availabilityRes.ok) {
            const availabilityData = await availabilityRes.json();
            setSlots(availabilityData.slots || []);
          }

          if (earningsRes.ok) {
            const earningsData = await earningsRes.json();
            setEarnings(earningsData.earnings || {});
          }

          if (payoutsRes.ok) {
            const payoutsData = await payoutsRes.json();
            setPayouts(payoutsData.payouts || []);
          }
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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
    <Tabs
      defaultValue="earnings"
      className="grid grid-cols-1 md:grid-cols-4 gap-6"
    >
      <TabsList className="md:col-span-1 bg-muted/30 border h-14 md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
        <TabsTrigger
          value="earnings"
          className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
        >
          <DollarSign className="h-4 w-4 mr-2 hidden md:inline" />
          <span>Earnings</span>
        </TabsTrigger>
        <TabsTrigger
          value="appointments"
          className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
        >
          <Calendar className="h-4 w-4 mr-2 hidden md:inline" />
          <span>Appointments</span>
        </TabsTrigger>
        <TabsTrigger
          value="availability"
          className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
        >
          <Clock className="h-4 w-4 mr-2 hidden md:inline" />
          <span>Availability</span>
        </TabsTrigger>
      </TabsList>
      <div className="md:col-span-3">
        <TabsContent value="appointments" className="border-none p-0">
          <DoctorAppointmentsList
            appointments={appointments}
          />
        </TabsContent>
        <TabsContent value="availability" className="border-none p-0">
          <AvailabilitySettings slots={slots} />
        </TabsContent>
        <TabsContent value="earnings" className="border-none p-0">
          <DoctorEarnings
            earnings={earnings}
            payouts={payouts}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
