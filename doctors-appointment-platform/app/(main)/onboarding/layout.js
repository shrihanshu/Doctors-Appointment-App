"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function OnboardingLayout({ children }) {
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

          // Redirect users who have already completed onboarding
          if (userData) {
            if (userData.role === "PATIENT") {
              router.push("/doctors");
            } else if (userData.role === "DOCTOR") {
              // Check verification status for doctors
              if (userData.verificationStatus === "VERIFIED") {
                router.push("/doctor");
              } else {
                router.push("/doctor/verification");
              }
            } else if (userData.role === "ADMIN") {
              router.push("/admin");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to MediMeet
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you want to use the platform
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
