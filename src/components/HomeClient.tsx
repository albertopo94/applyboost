"use client";

import { useState, useEffect } from "react";
import Wizard from "@/components/Wizard";
import EditorPreview from "@/components/EditorPreview";
import { Header } from "@/components/layout/Header";
import { QuotaBanner } from "@/components/layout/QuotaBanner";
import SocialProofTicker from "@/components/SocialProofTicker";
import { createClient } from "@/lib/db/supabase-browser";

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
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAnonymous(!user);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAnonymous(!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Calculate remaining uses based on generationData or default MVP limit (3)
  const remainingUses = generationData?.free_uses_remaining !== undefined 
    ? generationData.free_uses_remaining 
    : (3 - (generationData?.usage_count || 0));
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900/40 dark:selection:text-blue-100">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        
        <Header step={step} setStep={setStep} />

        {step === "RESULT" && isAnonymous && (
          <QuotaBanner 
            remainingUses={remainingUses} 
            isAnonymous={isAnonymous} 
          />
        )}

        {/* Content Area */}
        <div className="p-6 sm:p-10 md:p-14">
          {step === "WIZARD" ? (
            <Wizard onComplete={(data: any) => {
              setGenerationData(data);
              setStep("RESULT");
            }} />
          ) : (
             <EditorPreview data={generationData} />
          )}
          <SocialProofTicker initialStats={initialStats} />
        </div>
      </div>
    </main>
  );
}
