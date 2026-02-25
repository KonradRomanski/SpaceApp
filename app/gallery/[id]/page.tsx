"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type GalleryItem = {
  nasaId: string;
  title: string;
  description: string;
  image: string | null;
  keywords: string[];
  center: string | null;
  dateCreated: string | null;
};

export default function GalleryDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch(`/api/gallery/item?nasa_id=${encodeURIComponent(params.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.title) return;
        setItem(data);
      });
  }, [params.id]);

  if (!item) {
    return (
      <div className="min-h-screen px-6 py-16 md:px-16">
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link href="/gallery" className="text-sm uppercase tracking-[0.3em] text-white/60">
          ← Back to gallery
        </Link>
        <h1 className="text-4xl font-display text-gradient md:text-5xl">{item.title}</h1>
        {item.image ? (
          <Image src={item.image} alt={item.title} width={1200} height={720} className="h-72 w-full rounded-3xl object-cover" unoptimized />
        ) : null}
        <p className="text-lg text-white/70">{item.description}</p>
        <div className="grid gap-3 text-sm text-white/60 md:grid-cols-2">
          {item.center ? <span>Center: {item.center}</span> : null}
          {item.dateCreated ? <span>Date: {new Date(item.dateCreated).toLocaleDateString()}</span> : null}
        </div>
        {item.keywords?.length ? (
          <div className="flex flex-wrap gap-2 text-xs text-white/60">
            {item.keywords.slice(0, 8).map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/15 px-2 py-1">
                {keyword}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
