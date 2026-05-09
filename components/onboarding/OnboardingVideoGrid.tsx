import { OnboardingVideoCard } from "@/components/onboarding/OnboardingVideoCard";
import type { OnboardingVideoGuide } from "@/lib/onboarding/video-guides";

export function OnboardingVideoGrid({ videos }: { videos: OnboardingVideoGuide[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {videos.map((video) => (
        <OnboardingVideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
