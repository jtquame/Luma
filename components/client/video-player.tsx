"use client";

import { useRef, useState } from "react";
import { recordVideoView } from "@/app/(client)/coaching-videos-actions";

export function VideoPlayer({
  videoId,
  videoUrl,
  posterUrl,
}: {
  videoId: string;
  videoUrl: string;
  posterUrl?: string | null;
}) {
  const hasTrackedRef = useRef(false);

  function handlePlay() {
    // Only log once per page visit, not on every pause/resume.
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    recordVideoView(videoId);
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      controls
      preload="metadata"
      poster={posterUrl ?? undefined}
      onPlay={handlePlay}
      className="w-full rounded-lg bg-black"
      style={{ maxHeight: 480 }}
    >
      <source src={videoUrl} />
      Your browser doesn't support embedded video.
    </video>
  );
}
