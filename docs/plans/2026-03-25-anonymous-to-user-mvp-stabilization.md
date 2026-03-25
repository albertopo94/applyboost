# Anonymous-to-User MVP Stabilization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the persistent 500 error in middleware, stabilize cookie persistence on redirects, and implement the "Anonymous -> Registered" data merge trigger in the frontend.

**Architecture:** 
- **Middleware:** Refactor to ensure cookie persistence during `NextResponse.redirect` and `NextResponse.json` responses by explicitly copying headers. Add safety checks for `SUPABASE_SERVICE_ROLE_KEY`.
- **Frontend (Merge):** Implement a synchronization effect in `usePlatformTelemetry.ts` (or a dedicated component) that detects when a user logs in while an anonymous cookie is present, calls the `merge_anonymous_data` RPC, and clears the cookie.
- **UI Feedback:** Update `Wizard.tsx` to handle the `LIMIT_REACHED` error code and provide a clear CTA to login.

**Tech Stack:** Next.js 15, Supabase SSR, TypeScript, Tailwind CSS.

---

### Task 1: Stabilize Middleware & Fix 500 Error

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Refactor cookie handling**

Update the middleware to:
1. Wrap all terminal responses (redirects, json, etc.) to include the cookies from the initial `supabaseResponse`.
2. Add a `try/catch` around the `adminClient` usage and a check for `SERVICE_ROLE_KEY` to avoid crashing the whole app.

```typescript
// Proposed change snippet for src/middleware.ts
// ... inside middleware(request)
try {
  // ... supabase initialization
  
  // Helper to persist cookies in any response
  const withCookies = (res: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value);
    });
    return res;
  };

  // ... if (limit_reached)
  if (usage && usage.count >= 3) {
    return withCookies(NextResponse.json({ error: "LIMIT_REACHED" }, { status: 401 }));
  }

  // ... if (redirect to login)
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCookies(NextResponse.redirect(url));
  }
} catch (e) {
  console.error("Middleware error:", e);
  return supabaseResponse; // Fallback to avoid 500
}
```

**Step 2: Run dev server and verify no 500 on home page**

Run: `bun run dev`
Expected: Home page loads without "Internal Server Error".

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "fix: stabilize middleware cookie persistence and prevent 500 crashes"
```

---

### Task 2: Implement Frontend Data Merge Trigger

**Files:**
- Modify: `src/hooks/usePlatformTelemetry.ts` (or create `src/components/AuthSync.tsx`)
- Modify: `src/app/layout.tsx`

**Step 1: Implement the Merge Effect**

Add logic to detect `user` + `applyboost_anon_id` cookie, trigger RPC, and then delete the cookie.

```typescript
// Logic for usePlatformTelemetry.ts or new component
useEffect(() => {
  const syncData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const anonId = getCookie("applyboost_anon_id");

    if (user && anonId) {
      console.log("Detectado login con datos anónimos. Sincronizando...");
      const { error } = await supabase.rpc('merge_anonymous_data', { 
        anon_id: anonId, 
        target_user_id: user.id 
      });
      
      if (!error) {
        deleteCookie("applyboost_anon_id");
        toast.success("¡Tus documentos han sido sincronizados con tu cuenta!");
      }
    }
  };
  syncData();
}, [user]);
```

**Step 2: Run dev server and simulate a login**

Expected: Console logs "Sincronizando..." and data is moved in Supabase.

**Step 3: Commit**

```bash
git add src/hooks/usePlatformTelemetry.ts
git commit -m "feat: implement automatic data merge from anonymous to user on login"
```

---

### Task 3: Improve Wizard Limit Handling

**Files:**
- Modify: `src/components/Wizard.tsx`

**Step 1: Catch LIMIT_REACHED error**

Update the `handleSubmit` to specifically check for the `LIMIT_REACHED` string or code and set a specific error state.

```typescript
// src/components/Wizard.tsx
const data = await res.json();
if (!res.ok) {
  if (data?.error === "LIMIT_REACHED" || res.status === 401) {
     setError("Has alcanzado el límite de 3 generaciones gratuitas. ¡Logueate para seguir!");
     // Optionally trigger a login modal/redirect
     return;
  }
  // ... rest of errors
}
```

**Step 2: Run dev server and manually set count to 3 in DB**

Expected: Wizard shows the specific "Limit reached" error instead of a generic one.

**Step 3: Commit**

```bash
git add src/components/Wizard.tsx
git commit -m "ui: improve limit reached feedback in wizard"
```
