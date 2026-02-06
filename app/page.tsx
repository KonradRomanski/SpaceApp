import Link from "next/link";
import React from "react";
import { HomeFacts } from "../components/HomeFacts";
import { HomeGallery } from "../components/HomeGallery";

const modules = [
  {
    title: "Relativistic Calculator",
    description: "Model interstellar travel times, energy, and costs.",
    href: "/calculator"
  },
  {
    title: "Celestial Map",
    description: "Explore 2D/3D maps with verified data overlays.",
    href: "/map"
  },
  {
    title: "Body Explorer",
    description: "Deep dive into planets, moons, stars, and galaxies.",
    href: "/bodies"
  },
  {
    title: "Cosmic Facts",
    description: "Short space articles fetched from Wikipedia.",
    href: "/facts"
  },
  {
    title: "Gallery",
    description: "NASA image highlights you can browse in-app.",
    href: "/gallery"
  }
];

export default function HomePage() {
  const [showGuide, setShowGuide] = React.useState(false);

  React.useEffect(() => {
    const raw = localStorage.getItem("cj-guide-dismissed");
    setShowGuide(raw !== "true");
  }, []);

  function dismissGuide() {
    localStorage.setItem("cj-guide-dismissed", "true");
    setShowGuide(false);
  }

  return (
    <div className="min-h-screen px-6 pb-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Cosmic Journey</p>
          <h1 className="text-4xl font-display text-gradient md:text-6xl">
            A living atlas of the cosmos.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            Explore verified celestial data, map your journeys, and discover new
            objects across the universe.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/calculator"
              className="rounded-full bg-star-500 px-5 py-2 text-sm font-semibold text-space-900"
            >
              Launch Calculator
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80"
            >
              Open Map
            </Link>
            <Link
              href="/bodies"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80"
            >
              Body Explorer
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="glass card transition hover:-translate-y-1"
            >
              <h2 className="text-xl font-display text-star-500">{module.title}</h2>
              <p className="mt-3 text-sm text-white/70">{module.description}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/50">Open</p>
            </Link>
          ))}
        </section>

        {showGuide ? (
        <section className="glass card">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display text-star-500">Getting started</h2>
            <button
              onClick={dismissGuide}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Link href="/calculator" className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">Step 1</p>
              <p className="mt-2 text-sm text-white/80">Open the Calculator and pick a ship preset.</p>
            </Link>
            <Link href="/map" className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">Step 2</p>
              <p className="mt-2 text-sm text-white/80">Explore targets in the Map and switch 2D/3D.</p>
            </Link>
            <Link href="/facts" className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">Step 3</p>
              <p className="mt-2 text-sm text-white/80">Read Cosmic Facts and save discoveries to the map.</p>
            </Link>
          </div>
        </section>
        ) : null}

        <HomeFacts />
        <HomeGallery />
      </div>
    </div>
  );
}
