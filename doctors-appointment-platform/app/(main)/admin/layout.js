"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertCircle, Users, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function AdminLayout({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerkUserId: clerkUser.id }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          // Redirect if not an admin
          if (userData?.role !== "ADMIN") {
            router.push("/onboarding");
            return;
          }
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/onboarding");
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUser();
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

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader icon={<ShieldCheck />} title="Admin Settings" />

      {/* Vertical tabs on larger screens / Horizontal tabs on mobile */}
      <Tabs
        defaultValue="pending"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <TabsList className="md:col-span-1 bg-muted/30 border h-14 md:h-40 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0">
          <TabsTrigger
            value="pending"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value="doctors"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <Users className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Doctors</span>
          </TabsTrigger>
          <TabsTrigger
            value="payouts"
            className="flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full"
          >
            <CreditCard className="h-4 w-4 mr-2 hidden md:inline" />
            <span>Payouts</span>
          </TabsTrigger>
        </TabsList>
        <div className="md:col-span-3">{children}</div>
      </Tabs>
    </div>
  );
}
