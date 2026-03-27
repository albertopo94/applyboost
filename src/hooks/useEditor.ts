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
  const [templateMode, setTemplateMode] = useState<"simple" | "modern">("modern");
  const [downloadingType, setDownloadingType] = useState<"cv" | "cl" | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [hasLimitReached, setHasLimitReached] = useState(false);
  const { t } = useLanguage();
  const supabase = createClient();

  const hasCL = !!data.cover_letter;

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
