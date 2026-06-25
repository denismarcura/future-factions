import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { buildInviteUrl, buildInviteUrlFromProfile, defaultInviteOrigin, type InviteProfileLike } from "@/lib/invite-link";

export function useInviteUrl(user: User | null | undefined, origin = defaultInviteOrigin()) {
  const [profile, setProfile] = useState<InviteProfileLike>(null);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    if (!user?.id) return;

    supabase
      .from("profiles")
      .select("id, email, instagram, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as InviteProfileLike) ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return useMemo(() => {
    if (!user) return "";
    const urlFromProfile = buildInviteUrlFromProfile(
      {
        id: user.id,
        email: profile?.email ?? user.email ?? null,
        instagram: profile?.instagram ?? (typeof user.user_metadata?.instagram === "string" ? user.user_metadata.instagram : null),
        full_name: profile?.full_name ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null),
      },
      origin,
    );
    return urlFromProfile || buildInviteUrl(user, origin);
  }, [origin, profile?.email, profile?.full_name, profile?.instagram, user]);
}