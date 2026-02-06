"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Topic = {
  title: string;
  description: string;
  image: string | null;
  wikiUrl: string | null;
};

export default function TopicPage({ params }: { params: { title: string } }) {
  const title = decodeURIComponent(params.title);
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    fetch(`/api/facts/topic?title=${encodeURIComponent(title)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.title) return;
        setTopic(data);
      });
  }, [title]);

  if (!topic) {
    return (
      <div className="min-h-screen px-6 py-16 md:px-16">
        <p className="text-white/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link href="/facts" className="text-sm uppercase tracking-[0.3em] text-white/60">
          ← Back to facts
        </Link>
        <h1 className="text-4xl font-display text-gradient md:text-5xl">{topic.title}</h1>
        {topic.image ? (
          <img src={topic.image} alt={topic.title} className="h-72 w-full rounded-3xl object-cover" />
        ) : null}
        <p className="text-lg text-white/70">{topic.description}</p>
        {topic.wikiUrl ? (
          <a href={topic.wikiUrl} target="_blank" rel="noreferrer" className="text-sm text-star-500">
            Source: Wikipedia
          </a>
        ) : null}
      </div>
    </div>
  );
}
