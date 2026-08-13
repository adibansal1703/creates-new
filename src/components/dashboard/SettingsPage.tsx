import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_TIMEZONES } from "@/lib/constants/timezones";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { enqueueNotification } from "@/lib/api/notifications";

export function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, timezone")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setTimezone(data.timezone ?? "Asia/Kolkata");
        }
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setNewEmail(user.email ?? "");
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, timezone, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => toast.success("Settings saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  async function verifyCurrentPassword() {
    if (!user) throw new Error("Not authenticated");
    if (!currentPassword) throw new Error("Enter your current password to confirm changes.");

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email ?? "",
      password: currentPassword,
    });

    if (error) throw error;
  }

  async function handleChangeEmail() {
    if (!user) return;
    try {
      await verifyCurrentPassword();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Email update requested — check your inbox to confirm.");
      await enqueueNotification("email_changed", { email: newEmail });
      setCurrentPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleChangePassword() {
    if (!user) return;
    if (!newPassword) return toast.error("Please enter a new password.");
    try {
      await verifyCurrentPassword();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully.");
      await enqueueNotification("password_changed", {});
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleUploadAvatar(file?: File) {
    if (!user || !file) return;
    setUploading(true);
    try {
      const filePath = `avatars/${user.id}/${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = await supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updErr) throw updErr;
      toast.success("Profile picture uploaded.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  async function handleRequestAccountDeletion() {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("request_account_deletion");
      if (error) throw error;
      toast.success("Account deletion requested — check your email to confirm.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="rounded-lg p-6 border border-border bg-card shadow-subtle space-y-4">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Change email</Label>
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter your current password to confirm email or password changes.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleChangeEmail()}
              disabled={!currentPassword || !newEmail || newEmail === (user?.email ?? "")}
            >
              Change email
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Default timezone</Label>
          <Select value={timezone} onValueChange={setTimezone} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={saveMutation.isPending || loading} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
        <div className="border-t pt-4 mt-4 space-y-4">
          <div>
            <Label>Change password</Label>
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => handleChangePassword()}
                disabled={!newPassword || !currentPassword}
              >
                Change password
              </Button>
            </div>
          </div>

          <div>
            <Label>Profile picture</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadAvatar(e.target.files?.[0])}
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : "Upload picture"}
              </Button>
            </div>
          </div>

          <div>
            <Label>Delete account</Label>
            <p className="text-sm text-muted-foreground">
              Request permanent deletion — you will receive a confirmation email.
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    !confirm(
                      "Are you sure you want to request account deletion? This will send a confirmation email.",
                    )
                  )
                    return;
                  handleRequestAccountDeletion();
                }}
              >
                Request account deletion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
