import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PlatformBadge } from "@/components/dashboard/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchConnectedAccounts } from "@/lib/api/connected-accounts";
import { uploadPostMedia } from "@/lib/api/post-media";
import { publishMultiple, summarizeContent } from "@/lib/api/published-posts";
import { saveDraft } from "@/lib/api/drafts";
import {
  buildContentPayload,
  PUBLISHING_SESSION_KEY,
  resolvePublicMediaUrl,
  type PublishingSession,
} from "@/lib/publishing/content-summary";
import { PLATFORMS, PLATFORM_LABELS, type PostPlatform } from "@/lib/types/database";

const X_CHAR_LIMIT = 280;

export function PublishingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<PostPlatform[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showAction, setShowAction] = useState(false);
  const [uploadingMediaFor, setUploadingMediaFor] = useState<PostPlatform | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ["connected-accounts"],
    queryFn: fetchConnectedAccounts,
  });

  const isPlatformConnected = (p: PostPlatform) =>
    accounts?.some((a) => a.platform === p && a.is_connected) ?? false;

  const publishMutation = useMutation({
    mutationFn: async () => {
      const payload = buildContentPayload(selected, fields);
      const notConnected = selected.filter((p) => !isPlatformConnected(p));
      if (notConnected.length > 0) {
        throw new Error(
          `Connect ${notConnected.map((p) => PLATFORM_LABELS[p]).join(", ")} before publishing.`,
        );
      }
      await publishMultiple(selected, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-published"] });
      toast.success("Published successfully!");
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveDraftMutation = useMutation({
    mutationFn: saveDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Draft saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePlatform = (p: PostPlatform) => {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const setField = (key: string, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
  };

  const getPayload = () => buildContentPayload(selected, fields);

  const validateContent = (): boolean => {
    const payload = getPayload();
    const hasContent = selected.some((p) => summarizeContent(p, payload).trim().length > 0);
    if (!hasContent) {
      toast.error("Add content for at least one selected platform.");
      return false;
    }

    if (selected.includes("instagram")) {
      const mediaUrl = payload.instagram?.media_url;
      if (!mediaUrl) {
        toast.error("No image selected. Instagram posts require an image.");
        return false;
      }

      const resolvedUrl = resolvePublicMediaUrl(mediaUrl);
      if (!resolvedUrl) {
        toast.error(`Invalid image URL format: "${mediaUrl}". Please upload a valid image.`);
        return false;
      }
    }

    return true;
  };

  const handleMediaUpload = async (platform: PostPlatform, file?: File) => {
    if (!file) return;

    setUploadingMediaFor(platform);
    try {
      const publicUrl = await uploadPostMedia(file);
      setField(`${platform}_media`, publicUrl);
      toast.success("Media uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media upload failed.");
    } finally {
      setUploadingMediaFor(null);
    }
  };

  const continueToContent = () => {
    if (selected.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    setStep(2);
  };

  const continueToAction = () => {
    if (!validateContent()) return;
    setShowAction(true);
  };

  const handlePublishNow = () => {
    if (!validateContent()) return;
    publishMutation.mutate();
    setShowAction(false);
  };

  const handleSchedule = () => {
    if (!validateContent()) return;
    const payload = getPayload();
    const session: PublishingSession = {
      platforms: selected,
      contentPayload: payload,
    };
    sessionStorage.setItem(PUBLISHING_SESSION_KEY, JSON.stringify(session));
    setShowAction(false);
    navigate({ to: "/dashboard/scheduler" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-sm text-primary font-medium">Step {step} of 2</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Multi-Platform Publishing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compose once, then publish now or schedule for later.
        </p>
      </div>

      {step === 1 && (
        <div className="rounded-lg p-6 space-y-4 border border-border bg-card shadow-subtle">
          <h2 className="font-semibold">Select platforms</h2>
          <p className="text-sm text-muted-foreground">
            Select where this post should go. Connect accounts in{" "}
            <Link
              to="/dashboard/accounts"
              className="text-primary underline"
              search={{ reason: undefined, instagram: undefined }}
            >
              Connected Accounts
            </Link>{" "}
            to publish immediately.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const connected = isPlatformConnected(platform);
              const checked = selected.includes(platform);
              return (
                <label
                  key={platform}
                  className={`flex items-center gap-3 rounded-sm border-2 p-4 cursor-pointer transition-all duration-200 ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => togglePlatform(platform)} />
                  <div className="flex flex-col gap-1">
                    <PlatformBadge platform={platform} />
                    <span className="text-xs text-muted-foreground">
                      {connected ? "Connected" : "Not connected — scheduling OK"}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
          <Button disabled={selected.length === 0} onClick={continueToContent}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-lg p-6 space-y-6 border border-border bg-card shadow-subtle">
          <h2 className="font-semibold">Create content</h2>
          {selected.map((platform) => (
            <div key={platform} className="space-y-4 pb-4 border-b border-border/40 last:border-0">
              <PlatformBadge platform={platform} />
              {platform === "instagram" && (
                <>
                  <div className="space-y-2">
                    <Label>Caption</Label>
                    <Textarea
                      value={fields[`${platform}_caption`] ?? ""}
                      onChange={(e) => setField(`${platform}_caption`, e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Hashtags</Label>
                      <Input
                        placeholder="#creatory #ai"
                        value={fields[`${platform}_hashtags`] ?? ""}
                        onChange={(e) => setField(`${platform}_hashtags`, e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="Mumbai, India"
                        value={fields[`${platform}_location`] ?? ""}
                        onChange={(e) => setField(`${platform}_location`, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tagged accounts</Label>
                    <Input
                      placeholder="@brand, @creator"
                      value={fields[`${platform}_tagged_accounts`] ?? ""}
                      onChange={(e) => setField(`${platform}_tagged_accounts`, e.target.value)}
                    />
                  </div>
                </>
              )}
              {platform === "youtube" && (
                <>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={fields[`${platform}_title`] ?? ""}
                      onChange={(e) => setField(`${platform}_title`, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={fields[`${platform}_description`] ?? ""}
                      onChange={(e) => setField(`${platform}_description`, e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      placeholder="ai, marketing, content"
                      value={fields[`${platform}_tags`] ?? ""}
                      onChange={(e) => setField(`${platform}_tags`, e.target.value)}
                    />
                  </div>
                </>
              )}
              {(platform === "facebook" || platform === "linkedin") && (
                <div className="space-y-2">
                  <Label>Post content</Label>
                  <Textarea
                    value={fields[`${platform}_content`] ?? ""}
                    onChange={(e) => setField(`${platform}_content`, e.target.value)}
                  />
                </div>
              )}
              {platform === "x" && (
                <div className="space-y-2">
                  <Label>Post content</Label>
                  <Textarea
                    maxLength={X_CHAR_LIMIT}
                    value={fields[`${platform}_content`] ?? ""}
                    onChange={(e) => setField(`${platform}_content`, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {(fields[`${platform}_content`] ?? "").length} / {X_CHAR_LIMIT}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>{platform === "instagram" ? "Image (required)" : "Media"}</Label>
                <div className="rounded-sm border-2 border-dashed border-border p-4 text-sm text-muted-foreground bg-secondary/30">
                  <p>
                    {platform === "instagram"
                      ? "Upload a JPG or PNG. Instagram requires a public image URL to publish."
                      : `Upload media for ${PLATFORM_LABELS[platform]}.`}
                  </p>
                  <input
                    type="file"
                    accept={platform === "instagram" ? "image/*" : undefined}
                    aria-label={`Upload media for ${PLATFORM_LABELS[platform]}`}
                    className="mt-3 w-full text-sm text-muted-foreground"
                    disabled={uploadingMediaFor === platform}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      void handleMediaUpload(platform, file);
                    }}
                  />
                  {uploadingMediaFor === platform && (
                    <p className="mt-2 flex items-center gap-2 text-primary">
                      <Loader2 className="size-4 animate-spin" />
                      Uploading…
                    </p>
                  )}
                  {fields[`${platform}_media`] && (
                    <p className="mt-2 text-xs text-emerald-400 break-all">
                      Ready: {fields[`${platform}_media`]}
                    </p>
                  )}
                </div>
              </div>
              {!isPlatformConnected(platform) && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <p>
                    Please connect your account before creating content for{" "}
                    {PLATFORM_LABELS[platform]}.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link
                      to="/dashboard/accounts"
                      search={{ reason: undefined, instagram: undefined }}
                    >
                      Connect account
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={continueToAction}>Continue</Button>
            <Button
              variant="outline"
              disabled={selected.length === 0 || saveDraftMutation.isPending}
              onClick={async () => {
                if (selected.length === 0) {
                  toast.error("Select at least one platform before saving a draft.");
                  return;
                }
                const payload = getPayload();
                const hasContent = selected.some(
                  (p) => summarizeContent(p, payload).trim().length > 0,
                );
                if (!hasContent) {
                  toast.error("Add content before saving a draft.");
                  return;
                }
                await saveDraftMutation.mutateAsync({
                  platforms: selected,
                  contentPayload: payload,
                });
              }}
            >
              {saveDraftMutation.isPending ? "Saving draft…" : "Save draft"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showAction} onOpenChange={setShowAction}>
        <DialogContent className="bg-card border-border shadow-medium">
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
            <DialogDescription>
              Choose how to send your content to {selected.length} platform(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button
              className="h-11"
              disabled={publishMutation.isPending}
              onClick={handlePublishNow}
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Publishing…
                </>
              ) : (
                "Publish Now"
              )}
            </Button>
            <Button variant="outline" className="h-11" onClick={handleSchedule}>
              Schedule Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
