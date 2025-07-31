"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doctorFormSchema } from "@/lib/schema";
import { SPECIALTIES } from "@/lib/specialities";
import { useUser } from "@clerk/nextjs";

export default function OnboardingPage() {
  const [step, setStep] = useState("choose-role");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();

  console.log("Onboarding - Component rendered");
  console.log("Onboarding - Clerk user loaded:", isLoaded);
  console.log("Onboarding - Clerk user:", clerkUser);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      specialty: "",
      experience: undefined,
      credentialUrl: "",
      description: "",
    },
  });

  // Watch specialty value for controlled select component
  const specialtyValue = watch("specialty");

  // Handle patient role selection
  const handlePatientSelection = async () => {
    console.log("Onboarding - Patient selection clicked!");
    alert("Patient button clicked!"); // Simple alert to test if click works
    
    if (loading || !clerkUser) {
      console.log("Onboarding - Early return due to loading or no user");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Onboarding - Making API call to /api/user/set-role");
      
      const requestBody = { 
        role: "PATIENT",
        clerkUserId: clerkUser.id 
      };
      console.log("Onboarding - Request body:", requestBody);
      
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Onboarding - Response status:", response.status);
      console.log("Onboarding - Response ok:", response.ok);

      const data = await response.json();
      console.log("Onboarding - Response data:", data);

      if (response.ok && data.success) {
        console.log("Onboarding - Success, redirecting to:", data.redirect);
        router.push(data.redirect);
      } else {
        console.log("Onboarding - Error in response:", data.error);
        setError(data.error || 'Failed to set user role');
      }
    } catch (error) {
      console.error('Onboarding - Error setting user role:', error);
      setError('An error occurred while setting your role');
    } finally {
      console.log("Onboarding - Setting loading to false");
      setLoading(false);
    }
  };

  // Handle doctor form submission
  const onDoctorSubmit = async (formData) => {
    console.log("Onboarding - Doctor form submitted!");
    
    if (loading || !clerkUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: "DOCTOR",
          specialty: formData.specialty,
          experience: formData.experience,
          credentialUrl: formData.credentialUrl,
          description: formData.description,
          clerkUserId: clerkUser.id
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push(data.redirect);
      } else {
        setError(data.error || 'Failed to submit doctor profile');
      }
    } catch (error) {
      console.error('Error submitting doctor profile:', error);
      setError('An error occurred while submitting your profile');
    } finally {
      setLoading(false);
    }
  };

  // Role selection screen
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {error && (
          <div className="col-span-full mb-4 p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book appointments, consult with doctors, and manage your
              healthcare journey
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
              onClick={handlePatientSelection}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue as Patient"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              Create your professional profile, set your availability, and
              provide consultations
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
              onClick={() => setStep("doctor-form")}
            >
              Continue as Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Doctor registration form
  if (step === "doctor-form") {
    return (
      <Card className="border-emerald-900/20">
        <CardContent className="pt-6">
          <div className="mb-6">
            <CardTitle className="text-2xl font-bold text-white mb-2">
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription>
              Please provide your professional details for verification
            </CardDescription>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onDoctorSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Select
                value={specialtyValue}
                onValueChange={(value) => setValue("specialty", value)}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => (
                    <SelectItem
                      key={spec.name}
                      value={spec.name}
                      className="flex items-center gap-2"
                    >
                      <span className="text-emerald-400">{spec.icon}</span>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialty && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.specialty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g. 5"
                {...register("experience", { valueAsNumber: true })}
              />
              {errors.experience && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">Link to Credential Document</Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/my-medical-degree.pdf"
                {...register("credentialUrl")}
              />
              {errors.credentialUrl && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.credentialUrl.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please provide a link to your medical degree or certification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Your Services</Label>
              <Textarea
                id="description"
                placeholder="Describe your expertise, services, and approach to patient care..."
                rows="4"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("choose-role")}
                className="border-emerald-900/30"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
}
