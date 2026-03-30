"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Wizard from "@/components/Wizard";
import { Header } from "@/components/layout/Header";
import { QuotaBanner } from "@/components/layout/QuotaBanner";
import SocialProofTicker from "@/components/SocialProofTicker";
import { createClient } from "@/lib/db/supabase-browser";
import { AuthModal } from "@/components/auth/AuthModal";

const EditorPreview = dynamic(() => import("@/components/EditorPreview"), {
  loading: () => <div className="p-14 text-center text-slate-500 font-mono animate-pulse w-full">Iniciando editor...</div>
});

interface PlatformStats {
  page_views: number;
  cvs_generated: number;
  cvs_downloaded: number;
}

interface HomeClientProps {
  initialStats?: PlatformStats | null;
  initialAuthStatus: boolean;
  initialQuotaUsage: number;
  remainingUses: number;
}

export default function HomeClient({ initialStats, initialAuthStatus, initialQuotaUsage, remainingUses: initialRemainingUses }: HomeClientProps) {
  const [step, setStep] = useState<"WIZARD" | "RESULT">("WIZARD");
  const [generationData, setGenerationData] = useState<any>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialAuthStatus);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'default' | 'limit_reached'>('default');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [quotaUsage, setQuotaUsage] = useState<number>(initialQuotaUsage);
  const [remainingUses, setRemainingUses] = useState<number>(initialRemainingUses);
  
  const supabase = createClient();

  const handleOpenAuthModal = (mode: 'default' | 'limit_reached' = 'default') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/auth/quota");
      if (res.ok) {
        const data = await res.json();
        setQuotaUsage(data.usage_count);
        setRemainingUses(data.remaining_uses);
      }
    } catch (err) {
      console.error("Error fetching quota:", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      // Only react to active state changes, avoid SSR override logic
      const sessionIsAnon = !session?.user;
      if (sessionIsAnon !== isAnonymous) {
        setIsAnonymous(sessionIsAnon);
        fetchQuota(); // Refresh quota on active auth change
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase, isAnonymous]);

  const handleGoogleLogin = async () => {
    if (!supabase || isRedirecting) return;
    setIsRedirecting(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/api/auth/callback`,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      setIsRedirecting(false);
    }
  };

  // Remaining uses logic
  const currentRemaining = generationData?.free_uses_remaining !== undefined 
    ? generationData.free_uses_remaining 
    : remainingUses;
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-100">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        
        <Header 
          step={step} 
          setStep={setStep} 
          onOpenAuth={() => handleOpenAuthModal('default')} 
        />

        {isAnonymous === true && (
          <QuotaBanner 
            remainingUses={currentRemaining} 
            isAnonymous={isAnonymous} 
          />
        )}

        <div className="px-6 sm:px-10 md:px-14 pt-6 sm:pt-10 md:pt-14 pb-2 sm:pb-4 md:pb-6">
          {step === "WIZARD" ? (
            <Wizard 
              remainingUses={currentRemaining}
              isAnonymous={isAnonymous}
              onOpenAuth={handleOpenAuthModal}
              onComplete={(data: any) => {
                setGenerationData(data);
                setStep("RESULT");
                fetchQuota(); // Refresh quota after generation
              }} 
            />
          ) : (
             <EditorPreview data={generationData} />
          )}
          <SocialProofTicker initialStats={initialStats} />
        </div>
      </div>

      {/* RENDERED OUTSIDE THE OVERFLOW-HIDDEN CONTAINER */}
      <AuthModal 
        isOpen={showAuthModal}
        mode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onConfirm={handleGoogleLogin}
        isRedirecting={isRedirecting}
      />
    </main>
  );
}
