"use client";

import { recordVideoView } from "@/app/(client)/coaching-videos-actions";
import { Button } from "@/components/ui/button";

export function VideoWatchLink({ videoId, videoUrl }: { videoId: string; videoUrl: string }) {
  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Fire-and-forget — don't block opening the video on this.
        recordVideoView(videoId);
      }}
    >
      <Button size="sm">Watch</Button>
    </a>
  );
}
