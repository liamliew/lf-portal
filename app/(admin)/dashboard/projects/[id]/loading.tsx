import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="content">
      <div className="content-narrow">
        {/* Project header */}
        <div className="proj-hd">
          <Skeleton style={{ width: 120, height: 120, borderRadius: 14 }} />
          <div className="proj-hd-info">
            <Skeleton style={{ height: 12, width: 80, marginBottom: 10 }} />
            <Skeleton style={{ height: 34, width: 320, marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 24 }}>
              <Skeleton style={{ height: 13, width: 100 }} />
              <Skeleton style={{ height: 13, width: 100 }} />
            </div>
          </div>
        </div>

        <div className="files-layout">
          <div>
            {/* Files table */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Skeleton style={{ height: 18, width: 80 }} />
              <Skeleton style={{ height: 28, width: 100, borderRadius: 6 }} />
            </div>
            <div className="file-table">
              <div className="file-table-hd">
                <Skeleton style={{ height: 10, width: "100%" }} />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="file-row">
                  <Skeleton style={{ width: 16, height: 16, borderRadius: 4 }} />
                  <div className="file-name-cell">
                    <Skeleton style={{ width: 36, height: 36, borderRadius: 7 }} />
                    <div>
                      <Skeleton style={{ height: 13, width: 160, marginBottom: 4 }} />
                      <Skeleton style={{ height: 11, width: 100 }} />
                    </div>
                  </div>
                  <Skeleton style={{ height: 20, width: 32, borderRadius: 4 }} />
                  <Skeleton style={{ height: 11, width: 50 }} />
                  <Skeleton style={{ height: 11, width: 70 }} />
                  <Skeleton style={{ height: 11, width: 60 }} />
                  <Skeleton style={{ height: 26, width: 52, borderRadius: 5 }} />
                </div>
              ))}
            </div>
          </div>

          <div className="right-rail">
            {/* Share links */}
            <div className="card">
              <div className="card-hd">
                <Skeleton style={{ height: 14, width: 110 }} />
                <Skeleton style={{ height: 28, width: 90, borderRadius: 6 }} />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="share-card" style={{ margin: "10px 14px" }}>
                  <Skeleton style={{ height: 13, width: 140 }} />
                  <Skeleton style={{ height: 28, width: "100%", borderRadius: 6 }} />
                  <Skeleton style={{ height: 11, width: 100 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
