import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getDefaultScheduleValues, minScheduleDateString } from "@/lib/scheduled-post-utils";
import { PLATFORM_LABELS, PLATFORMS, type PostPlatform } from "@/lib/types/database";
import { postScheduleSchema, type PostScheduleFormValues } from "@/lib/validations/post-schedule";

type PostScheduleFormProps = {
  defaultValues?: Partial<PostScheduleFormValues>;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: PostScheduleFormValues) => Promise<void>;
  onCancel?: () => void;
};

export function PostScheduleForm({
  defaultValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: PostScheduleFormProps) {
  const scheduleDefaults = getDefaultScheduleValues();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostScheduleFormValues>({
    resolver: zodResolver(postScheduleSchema),
    defaultValues: {
      platform: defaultValues?.platform,
      content: defaultValues?.content ?? "",
      scheduleDate: defaultValues?.scheduleDate ?? scheduleDefaults.date,
      scheduleTime: defaultValues?.scheduleTime ?? scheduleDefaults.time,
    },
  });

  const platform = watch("platform");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Platform</Label>
        <Select
          value={platform}
          onValueChange={(value) =>
            setValue("platform", value as PostPlatform, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.platform && <p className="text-xs text-destructive">{errors.platform.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Post content</Label>
        <Textarea
          id="content"
          placeholder="Write your post…"
          rows={6}
          className="resize-y min-h-[140px]"
          {...register("content")}
        />
        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Media (optional)</Label>
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center bg-secondary/30">
          <ImagePlus className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">Drag & drop or click to upload</p>
          <p className="mt-1 text-xs text-muted-foreground/80">Coming soon — images & video</p>
          <Input type="file" className="mt-4" disabled aria-label="Media upload placeholder" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduleDate">Schedule date</Label>
          <Input
            id="scheduleDate"
            type="date"
            min={minScheduleDateString()}
            {...register("scheduleDate")}
          />
          {errors.scheduleDate && (
            <p className="text-xs text-destructive">{errors.scheduleDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduleTime">Schedule time</Label>
          <Input id="scheduleTime" type="time" {...register("scheduleTime")} />
          {errors.scheduleTime && (
            <p className="text-xs text-destructive">{errors.scheduleTime.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
