import type { ComponentType } from "react";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_LABELS, type PostPlatform } from "@/lib/types/database";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const platformIcons: Record<PostPlatform, ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x: XIcon,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
};

export function PlatformBadge({
  platform,
  className,
}: {
  platform: PostPlatform;
  className?: string;
}) {
  const Icon = platformIcons[platform];

  return (
    <Badge variant="outline" className={cn("gap-1.5 border-border/60 bg-secondary/40", className)}>
      <Icon className="size-3.5" />
      {PLATFORM_LABELS[platform]}
    </Badge>
  );
}
