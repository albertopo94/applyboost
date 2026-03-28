"use client";

import { useState, useEffect } from "react";
import Wizard from "@/components/Wizard";
import EditorPreview from "@/components/EditorPreview";
import { Header } from "@/components/layout/Header";
import { QuotaBanner } from "@/components/layout/QuotaBanner";
import SocialProofTicker from "@/components/SocialProofTicker";
import { createClient } from "@/lib/db/supabase-browser";
import { AuthModal } from "@/components/auth/AuthModal";

interface PlatformStats {
  page_views: number;
  cvs_generated: number;
  cvs_downloaded: number;
}

interface HomeClientProps {
  initialStats?: PlatformStats | null;
}

export default function HomeClient({ initialStats }: HomeClientProps) {
  const [step, setStep] = useState<"WIZARD" | "RESULT">("WIZARD");
  const [generationData, setGenerationData] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [quotaUsage, setQuotaUsage] = useState(0);
  
  const supabase = createClient();

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/auth/quota");
      if (res.ok) {
        const data = await res.json();
        setQuotaUsage(data.usage_count || 0);
      }
    } catch (err) {
      console.error("Error fetching quota:", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !supabase) {
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAnonymous(!user);
        fetchQuota(); // Fetch initial quota
      } catch (err) {
        console.error("Auth check error:", err);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAnonymous(!session?.user);
      fetchQuota(); // Refresh quota on auth change
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleLogin = async () => {
    if (!supabase || isRedirecting) return;
    setIsRedirecting(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/api/auth/callback",
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      setIsRedirecting(false);
    }
  };

  // Remaining uses: either from generationData (just generated) or from the persistent quotaUsage
  const currentUsage = generationData?.usage_count !== undefined ? generationData.usage_count : quotaUsage;
  const remainingUses = generationData?.free_uses_remaining !== undefined 
    ? generationData.free_uses_remaining 
    : (3 - currentUsage);
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-100">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        
        <Header 
          step={step} 
          setStep={setStep} 
          onOpenAuth={() => setShowAuthModal(true)} 
        />

        {isAnonymous && (
          <QuotaBanner 
            remainingUses={remainingUses} 
            isAnonymous={isAnonymous} 
          />
        )}

        <div className="p-6 sm:p-10 md:p-14">
          {step === "WIZARD" ? (
            <Wizard onComplete={(data: any) => {
              setGenerationData(data);
              setStep("RESULT");
              fetchQuota(); // Refresh quota after generation
            }} />
          ) : (
             <EditorPreview data={generationData} />
          )}
          <SocialProofTicker initialStats={initialStats} />
        </div>
      </div>

      {/* RENDERED OUTSIDE THE OVERFLOW-HIDDEN CONTAINER */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConfirm={handleGoogleLogin}
        isRedirecting={isRedirecting}
      />
    </main>
  );
}
