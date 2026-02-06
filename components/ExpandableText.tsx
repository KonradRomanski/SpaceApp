"use client";

import { useState } from "react";

type ExpandableTextProps = {
  text: string;
  collapsedLines?: number;
};

export function ExpandableText({ text, collapsedLines = 5 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="text-sm text-white/70">
      <p
        className={expanded ? "" : `line-clamp-${collapsedLines}`}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }
        }
      >
        {text}
      </p>
      <button
        className="mt-2 text-xs uppercase tracking-widest text-star-500"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
