import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="content">
      <div className="content-narrow">
        {/* Page header */}
        <div className="page-h">
          <div>
            <Skeleton style={{ height: 34, width: 240, marginBottom: 8 }} />
            <Skeleton style={{ height: 16, width: 140 }} />
          </div>
        </div>

        {/* KPI grid */}
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="kpi">
              <Skeleton style={{ height: 12, width: 80, marginBottom: 12 }} />
              <Skeleton style={{ height: 32, width: 120 }} />
            </div>
          ))}
        </div>

        <div className="dash-grid">
          <div>
            {/* Recent uploads card */}
            <div className="card" style={{ marginBottom: "var(--dens-gap)" }}>
              <div className="card-hd">
                <Skeleton style={{ height: 14, width: 120 }} />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="act-row">
                  <Skeleton style={{ width: 32, height: 32, borderRadius: 7 }} />
                  <div>
                    <Skeleton style={{ height: 13, width: 180, marginBottom: 4 }} />
                    <Skeleton style={{ height: 11, width: 100 }} />
                  </div>
                  <Skeleton style={{ height: 11, width: 50 }} />
                  <Skeleton style={{ height: 11, width: 40 }} />
                </div>
              ))}
            </div>

            {/* Active projects */}
            <div style={{ display: "flex", justifyContent: "space-between", margin: "28px 0 14px" }}>
              <Skeleton style={{ height: 18, width: 140 }} />
              <Skeleton style={{ height: 12, width: 100 }} />
            </div>
            <div className="project-card-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="proj-card">
                  <Skeleton style={{ aspectRatio: "16/10", borderRadius: 8 }} />
                  <Skeleton style={{ height: 14, width: "70%" }} />
                  <Skeleton style={{ height: 22, width: 80, borderRadius: 999 }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* Share links card */}
            <div className="card">
              <div className="card-hd">
                <Skeleton style={{ height: 14, width: 130 }} />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="link-row">
                  <Skeleton style={{ height: 13, width: 150, marginBottom: 4 }} />
                  <Skeleton style={{ height: 20, width: "100%", borderRadius: 4 }} />
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
