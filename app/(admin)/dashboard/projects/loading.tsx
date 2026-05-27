import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="content">
      <div className="content-narrow">
        <div className="page-h">
          <Skeleton style={{ height: 34, width: 180 }} />
          <Skeleton style={{ height: 34, width: 120, borderRadius: 8 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--dens-gap)" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="proj-card">
              <Skeleton style={{ aspectRatio: "16/10", borderRadius: 8 }} />
              <Skeleton style={{ height: 14, width: "60%", marginTop: 4 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <Skeleton style={{ height: 22, width: 60, borderRadius: 999 }} />
                <Skeleton style={{ height: 22, width: 100, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
