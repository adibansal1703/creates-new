import { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { generateContentIdeas, generateCaption } from "@/lib/api/ai-content-ideas.functions";
import { uploadPostMedia } from "@/lib/api/post-media";
import type { ContentIdea, GeneratedCaption, Emotion } from "@/lib/types/ai";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Calendar, Wand2, Upload, Image as ImageIcon } from "lucide-react";
import { PUBLISHING_SESSION_KEY, type PublishingSession } from "@/lib/publishing/content-summary";

const EMOTIONS: Emotion[] = [
  "Default",
  "Happy",
  "Funny",
  "Inspirational",
  "Motivational",
  "Emotional",
  "Romantic",
  "Sad",
  "Educational",
  "Professional",
  "Urgent",
  "Storytelling",
];

export function AIContentIdeasPage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goal, setGoal] = useState("Grow Followers");
  const [emotion, setEmotion] = useState<Emotion>("Default");
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [captions, setCaptions] = useState<Record<number, GeneratedCaption>>({});
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const accessToken = session?.access_token;

  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      if (!niche.trim() || !targetAudience.trim()) {
        throw new Error("Please fill in all fields");
      }
      if (!accessToken) {
        throw new Error("You must be logged in");
      }
      const response = await generateContentIdeas({
        data: {
          accessToken,
          niche: niche.trim(),
          targetAudience: targetAudience.trim(),
          goal,
          emotion,
        },
      });
      return response.ideas;
    },
    onSuccess: (ideas) => {
      setGeneratedIdeas(ideas);
      setCaptions({});
      toast.success("Generated 5 content ideas!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const generateCaptionMutation = useMutation({
    mutationFn: async ({ idea, index }: { idea: ContentIdea; index: number }) => {
      if (!accessToken) {
        throw new Error("You must be logged in");
      }
      const caption = await generateCaption({
        data: {
          accessToken,
          title: idea.title,
          hook: idea.hook,
          postType: idea.postType,
          contentGoal: idea.contentGoal,
          talkingPoints: idea.talkingPoints,
          niche: niche.trim(),
          targetAudience: targetAudience.trim(),
          goal,
          emotion: idea.emotion,
        },
      });
      return { index, caption };
    },
    onSuccess: ({ index, caption }) => {
      setCaptions((prev) => ({ ...prev, [index]: caption }));
      toast.success("Caption generated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSchedule = (idea: ContentIdea, index: number) => {
    const caption = captions[index];
    const mediaUrl = mediaUrls[index];

    // If caption exists, use it; otherwise use the idea content directly
    const fullCaption = caption
      ? `${caption.caption}\n\n${caption.cta}\n\n${caption.hashtags.map((tag) => `#${tag}`).join(" ")}`
      : `${idea.hook}\n\n${idea.talkingPoints.join("\n")}`;

    const hashtags = caption
      ? caption.hashtags.map((tag) => `#${tag}`).join(" ")
      : `#${idea.contentGoal} #${idea.postType} #${idea.emotion}`;

    const publishingSession: PublishingSession = {
      platforms: ["instagram"],
      contentPayload: {
        instagram: {
          caption: fullCaption,
          hashtags: hashtags,
          location: "",
          tagged_accounts: "",
          media_url: mediaUrl || null,
        },
      },
    };

    sessionStorage.setItem(PUBLISHING_SESSION_KEY, JSON.stringify(publishingSession));
    navigate({ to: "/dashboard/scheduler" });
  };

  const handleMediaUpload = (index: number) => {
    const input = fileInputRefs.current[index];
    if (input) {
      input.click();
    }
  };

  const handleFileChange = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await uploadPostMedia(file);
      setMediaUrls((prev) => ({ ...prev, [index]: publicUrl }));
      toast.success("Media uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media upload failed");
    }
  };

  const handleGenerateAIImage = async (index: number) => {
    toast.info("AI image generation coming soon");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="size-8 text-primary" />
          AI Content Ideas
        </h1>
        <p className="mt-1 text-muted-foreground">Generate Instagram content ideas with AI</p>
      </div>

      <Card className="shadow-subtle">
        <CardHeader>
          <CardTitle>Generate Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="niche">Niche</Label>
            <Input
              id="niche"
              placeholder="e.g., Fitness, Fashion, Tech"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Young professionals, Fitness enthusiasts"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grow Followers">Grow Followers</SelectItem>
                <SelectItem value="Increase Engagement">Increase Engagement</SelectItem>
                <SelectItem value="Generate Leads">Generate Leads</SelectItem>
                <SelectItem value="Sell Product/Service">Sell Product/Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Emotion</Label>
            <Select value={emotion} onValueChange={(value) => setEmotion(value as Emotion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMOTIONS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={() => generateIdeasMutation.mutate()}
            disabled={generateIdeasMutation.isPending}
          >
            {generateIdeasMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Wand2 className="size-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedIdeas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generated Ideas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {generatedIdeas.map((idea, index) => (
              <Card key={index} className="shadow-subtle flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Idea #{index + 1}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="w-fit">
                      {idea.postType}
                    </Badge>
                    <Badge variant="outline" className="w-fit">
                      {idea.contentGoal}
                    </Badge>
                    <Badge variant="outline" className="w-fit">
                      {idea.emotion}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm mt-1">{idea.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Visual Concept</Label>
                    <div className="text-sm mt-1 text-muted-foreground">
                      {typeof idea.visualConcept === "string" ? (
                        <p>{idea.visualConcept}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(idea.visualConcept).map(([key, value]) => (
                            <div key={key} className="bg-muted/30 p-2 rounded">
                              <p className="font-medium capitalize">{key}</p>
                              <p className="text-xs">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Hook</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{idea.hook}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Talking Points</Label>
                    <ul className="text-sm mt-1 text-muted-foreground list-disc list-inside space-y-1">
                      {idea.talkingPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  {captions[index] && (
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label className="text-sm font-medium">Generated Caption</Label>
                      <div className="text-sm space-y-2 bg-muted/30 p-3 rounded-lg">
                        <p>{captions[index].caption}</p>
                        <p className="font-medium">{captions[index].cta}</p>
                        <p className="text-xs text-muted-foreground">
                          {captions[index].hashtags.map((tag) => `#${tag}`).join(" ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {mediaUrls[index] && (
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label className="text-sm font-medium">Uploaded Media</Label>
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={mediaUrls[index]}
                          alt="Uploaded media"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <Label className="text-sm font-medium">Media</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleMediaUpload(index)}>
                        <Upload className="size-4 mr-2" />
                        Upload Media
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAIImage(index)}
                      >
                        <ImageIcon className="size-4 mr-2" />
                        Generate AI Image
                      </Button>
                    </div>
                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => generateCaptionMutation.mutate({ idea, index })}
                      disabled={generateCaptionMutation.isPending}
                    >
                      {generateCaptionMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4 mr-2" />
                      )}
                      Generate Caption
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSchedule(idea, index)}
                    >
                      <Calendar className="size-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
