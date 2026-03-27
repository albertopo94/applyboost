import { useState, useEffect } from "react";
import { createClient } from "@/lib/db/supabase-browser";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GenerateResponse } from "@/lib/llm/types";
import { toast } from "sonner";

type Tab = "cv" | "cl";

export function useEditor(data: GenerateResponse) {
  const [activeTab, setActiveTab] = useState<Tab>("cv");
  const [cvText, setCvText] = useState(data.cv_optimizado);
  const [clText, setClText] = useState(data.cover_letter || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [templateMode, setTemplateMode] = useState<"simple" | "modern">("modern");
  const [downloadingType, setDownloadingType] = useState<"cv" | "cl" | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [hasLimitReached, setHasLimitReached] = useState(false);
  const { t } = useLanguage();
  const supabase = createClient();

  const hasCL = !!data.cover_letter;

  // Feature Flag: Set to true when we want to start persisting CV text changes to DB (Post-MVP)
  const ENABLE_AUTO_SAVE = false;

  useEffect(() => {
    if (!supabase) return;
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAnonymous(!user);
    };
    checkUser();
  }, [supabase?.auth]);

  useEffect(() => {
    if (!hasCL && activeTab === "cl") {
      setActiveTab("cv");
      console.warn("Cover letter data missing. Defaulting to CV tab.");
    }
  }, [hasCL, activeTab]);

  // Auto-save debounce logic
  useEffect(() => {
    if (isAnonymous || !ENABLE_AUTO_SAVE) return;

    const isCvChanged = cvText !== data.cv_optimizado;
    const isClChanged = clText !== (data.cover_letter || "");

    if (!isCvChanged && !isClChanged) {
      return;
    }

    setSaveStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/cv/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generation_id: data.generation_id,
            cv_text: cvText,
            cl_text: clText,
          }),
        });

        if (!res.ok) throw new Error("Save failed");
        
        setSaveStatus("saved");
        const resetTimeout = setTimeout(() => setSaveStatus("idle"), 3000);
        return () => clearTimeout(resetTimeout);
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("error");
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [cvText, clText, data.generation_id, data.cv_optimizado, data.cover_letter, isAnonymous]);

  useEffect(() => {
    const disableCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    document.addEventListener("copy", disableCopy);
    return () => document.removeEventListener("copy", disableCopy);
  }, []);

  const handleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/api/auth/callback",
      },
    });
  };

  const handleDownload = async (typeParam?: Tab) => {
    const type = typeParam || activeTab;
    setDownloadingType(type);
    
    try {
      const text = type === "cv" ? cvText : clText;
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          filename: type === "cv" ? "CV_Optimizado.pdf" : "Carta_Presentacion.pdf",
          type: type,
          templateMode: templateMode
        }),
      });

      if (res.status === 403 || res.status === 429) {
        const errorData = await res.json();
        if (errorData.error === "LIMIT_REACHED") {
          setHasLimitReached(true);
          toast.error(t("editor.limit_reached") || "Límite de descargas alcanzado.");
          return;
        }
      }

      if (res.status === 401) {
        toast.error(t("editor.unauthorized") || "Debes iniciar sesión para descargar.");
        if (!isAnonymous) {
          window.location.href = "/login";
        }
        return;
      }

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "cv" ? "CV_Optimizado.pdf" : "Carta_Presentacion.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("editor.download_success") || "Archivo descargado con éxito.");

    } catch (err) {
      console.error("Download error:", err);
      toast.error(t("editor.export_error") || "Error al exportar el documento.");
    } finally {
      setDownloadingType(null);
    }
  };

  return {
    activeTab,
    setActiveTab,
    cvText,
    setCvText,
    clText,
    setClText,
    saveStatus,
    templateMode,
    setTemplateMode,
    downloadingType,
    isAnonymous,
    hasLimitReached,
    hasCL,
    handleLogin,
    handleDownload,
    t
  };
}
