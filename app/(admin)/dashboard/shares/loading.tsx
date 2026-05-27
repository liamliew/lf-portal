import { Skeleton } from "@/components/ui/skeleton";

export default function SharesLoading() {
  return (
    <div className="content">
      <div className="content-narrow">
        <div className="page-h">
          <Skeleton style={{ height: 34, width: 160 }} />
        </div>

        <div className="file-table">
          <div className="file-table-hd">
            <Skeleton style={{ height: 10, width: "100%" }} />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 100px 120px 100px", gap: 12, alignItems: "center", padding: "0 16px", height: "var(--dens-row)", borderBottom: "1px solid var(--hairline)" }}>
              <div>
                <Skeleton style={{ height: 13, width: 140, marginBottom: 4 }} />
                <Skeleton style={{ height: 20, width: 200, borderRadius: 4 }} />
              </div>
              <Skeleton style={{ height: 12, width: 80 }} />
              <Skeleton style={{ height: 22, width: 70, borderRadius: 999 }} />
              <Skeleton style={{ height: 11, width: 80 }} />
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <Skeleton style={{ height: 26, width: 26, borderRadius: 5 }} />
                <Skeleton style={{ height: 26, width: 26, borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
