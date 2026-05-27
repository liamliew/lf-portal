"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { search, type SearchResults } from "@/app/actions/search";
import { Icon } from "@/components/icon";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      try {
        const data = await search(debouncedQuery);
        setResults(data);
      } catch {
        setResults(null);
      }
    });
  }, [debouncedQuery]);

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  const hasResults =
    results &&
    (results.projects.length > 0 || results.files.length > 0 || results.shares.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search projects, files, and share links">
      <CommandInput
        placeholder="Search projects, files, share links…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isPending && (
          <div style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="loader" size={12} />
            Searching…
          </div>
        )}

        {!isPending && debouncedQuery.trim() && !hasResults && (
          <CommandEmpty>No results for &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
        )}

        {!isPending && results && results.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {results.projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project-${p.id}`}
                onSelect={() => navigate(`/dashboard/projects/${p.id}`)}
              >
                <Icon name="folder" size={14} />
                <span>{p.name}</span>
                {p.description && (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
                    {p.description.slice(0, 40)}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isPending && results && results.files.length > 0 && (
          <CommandGroup heading="Files">
            {results.files.map((f) => (
              <CommandItem
                key={f.id}
                value={`file-${f.id}`}
                onSelect={() => navigate(`/dashboard/files`)}
              >
                <Icon name={f.mime_type?.startsWith("video") ? "film" : "doc"} size={14} />
                <span>{f.filename}</span>
                {f.drive_name && (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {f.drive_name}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isPending && results && results.shares.length > 0 && (
          <CommandGroup heading="Share links">
            {results.shares.map((s) => (
              <CommandItem
                key={s.id}
                value={`share-${s.id}`}
                onSelect={() => navigate(`/dashboard/shares`)}
              >
                <Icon name="link" size={14} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  /share/{s.token.slice(0, 12)}…
                </span>
                {s.project_name && (
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
                    {s.project_name}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
