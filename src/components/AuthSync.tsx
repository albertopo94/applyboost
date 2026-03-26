"use client";

import { usePlatformTelemetry } from "@/hooks/usePlatformTelemetry";

export default function AuthSync() {
  usePlatformTelemetry();
  return null;
}
