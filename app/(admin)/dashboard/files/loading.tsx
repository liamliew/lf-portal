import { Skeleton } from "@/components/ui/skeleton";

export default function FilesLoading() {
  return (
    <div className="content">
      <div className="content-narrow">
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <Skeleton style={{ height: 13, width: 30 }} />
          <Skeleton style={{ height: 13, width: 12 }} />
          <Skeleton style={{ height: 13, width: 80 }} />
        </div>

        {/* Page header */}
        <div className="page-h">
          <div>
            <Skeleton style={{ height: 34, width: 180, marginBottom: 8 }} />
            <Skeleton style={{ height: 13, width: 140 }} />
          </div>
        </div>

        {/* Folder grid */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <Skeleton style={{ height: 12, width: 60 }} />
            <Skeleton style={{ height: 28, width: 100, borderRadius: 6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: 8, marginBottom: 10 }} />
                <Skeleton style={{ height: 13, width: "80%", marginBottom: 6 }} />
                <Skeleton style={{ height: 11, width: "60%" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <Skeleton style={{ height: 34, flex: 1, maxWidth: 340, borderRadius: 8 }} />
          <div style={{ flex: 1 }} />
          <Skeleton style={{ height: 28, width: 120, borderRadius: 6 }} />
        </div>

        {/* File table */}
        <div className="file-table">
          <div className="file-table-hd">
            <Skeleton style={{ height: 10, width: "100%" }} />
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="file-row" style={{ gridTemplateColumns: "1.6fr 0.8fr 80px 100px 130px 160px" }}>
              <div className="file-name-cell">
                <Skeleton style={{ width: 36, height: 36, borderRadius: 7 }} />
                <div>
                  <Skeleton style={{ height: 13, width: 160, marginBottom: 4 }} />
                  <Skeleton style={{ height: 11, width: 100 }} />
                </div>
              </div>
              <Skeleton style={{ height: 12, width: 60 }} />
              <Skeleton style={{ height: 20, width: 32, borderRadius: 4 }} />
              <Skeleton style={{ height: 11, width: 55 }} />
              <Skeleton style={{ height: 11, width: 80 }} />
              <Skeleton style={{ height: 26, width: 52, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
