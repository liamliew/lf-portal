export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  director: string;
  shootDate: string;
  deliveryDate?: string;
  status: string;
  statusKind: "accent" | "warn" | "info" | "success" | "outline";
  files: number;
  versions: number;
  size: string;
  cover: [string, string];
  activeLinks: number;
  lastActivity: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: "video" | "image" | "audio" | "doc";
  version: string;
  versionFinal: boolean;
  size: string;
  duration?: string;
  resolution?: string;
  codec?: string;
  modified: string;
  modifiedBy: string;
  shared: boolean;
  sharedTo: string[];
  versions: number;
}

export interface ShareLink {
  id: string;
  name: string;
  url: string;
  project: string;
  projectCode: string;
  files: number;
  views: number;
  downloads: number;
  created: string;
  expires: string;
  expiresIn: string;
  protected: boolean;
  revoked: boolean;
}

export interface FileVersion {
  tag: string;
  current: boolean;
  label: string;
  by: string;
  when: string;
  size: string;
  note?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "lf-2026-091",
    code: "LF-2026-091",
    name: "Aesop · Aura Campaign",
    client: "Aesop",
    director: "M. Okonkwo",
    shootDate: "May 02–04, 2026",
    deliveryDate: "May 22, 2026",
    status: "In delivery",
    statusKind: "accent",
    files: 38,
    versions: 64,
    size: "186.4 GB",
    cover: ["#FFD1B8", "#FF8A6B"],
    activeLinks: 2,
    lastActivity: "12 min ago",
  },
  {
    id: "lf-2026-088",
    code: "LF-2026-088",
    name: "Polestar · Quiet Drive (Hero Cut)",
    client: "Polestar",
    director: "S. Marković",
    shootDate: "Apr 18–22, 2026",
    status: "Review",
    statusKind: "warn",
    files: 24,
    versions: 41,
    size: "112.8 GB",
    cover: ["#A8BFFF", "#5C7EFF"],
    activeLinks: 1,
    lastActivity: "2 hr ago",
  },
  {
    id: "lf-2026-084",
    code: "LF-2026-084",
    name: "Patagonia · Headwaters Doc",
    client: "Patagonia",
    director: "K. Tanaka",
    shootDate: "Mar 30–Apr 06, 2026",
    status: "Edit",
    statusKind: "info",
    files: 142,
    versions: 218,
    size: "612.3 GB",
    cover: ["#B8E6CC", "#4DA88A"],
    activeLinks: 0,
    lastActivity: "yesterday",
  },
  {
    id: "lf-2026-079",
    code: "LF-2026-079",
    name: "Glossier · You Re-Launch",
    client: "Glossier",
    director: "M. Okonkwo",
    shootDate: "Mar 12–13, 2026",
    status: "Delivered",
    statusKind: "success",
    files: 56,
    versions: 89,
    size: "248.1 GB",
    cover: ["#FFC4DC", "#E274A0"],
    activeLinks: 4,
    lastActivity: "3 days ago",
  },
  {
    id: "lf-2026-074",
    code: "LF-2026-074",
    name: "Mercedes-EQ · Future, Forward",
    client: "Mercedes-Benz",
    director: "L. Persson",
    shootDate: "Feb 24–28, 2026",
    status: "Archive",
    statusKind: "outline",
    files: 87,
    versions: 134,
    size: "402.7 GB",
    cover: ["#D4D4DA", "#74747F"],
    activeLinks: 0,
    lastActivity: "2 weeks ago",
  },
  {
    id: "lf-2026-068",
    code: "LF-2026-068",
    name: "Hermès · Saut Hermès 2026",
    client: "Hermès",
    director: "S. Marković",
    shootDate: "Feb 06–08, 2026",
    status: "Delivered",
    statusKind: "success",
    files: 71,
    versions: 102,
    size: "291.5 GB",
    cover: ["#E8AC74", "#A45A1F"],
    activeLinks: 1,
    lastActivity: "3 weeks ago",
  },
];

export const FILES: FileItem[] = [
  { id: "f01", name: "AESOP_Aura_HeroCut_30s.mp4", type: "video", version: "v7", versionFinal: false, size: "2.41 GB", duration: "0:30", resolution: "3840 × 2160", codec: "H.265 · 422 HQ", modified: "May 14, 16:42", modifiedBy: "Liam F.", shared: true, sharedTo: ["AE"], versions: 7 },
  { id: "f02", name: "AESOP_Aura_HeroCut_15s.mp4", type: "video", version: "v5", versionFinal: false, size: "1.18 GB", duration: "0:15", resolution: "3840 × 2160", codec: "H.265 · 422 HQ", modified: "May 14, 16:38", modifiedBy: "Liam F.", shared: true, sharedTo: ["AE"], versions: 5 },
  { id: "f03", name: "AESOP_Aura_Social_Reels_v3.mp4", type: "video", version: "v3", versionFinal: false, size: "624 MB", duration: "0:09", resolution: "1080 × 1920", codec: "H.264", modified: "May 14, 12:08", modifiedBy: "P. Yi", shared: false, sharedTo: [], versions: 3 },
  { id: "f04", name: "AESOP_Aura_KeyArt_master.psd", type: "image", version: "v_FINAL", versionFinal: true, size: "412 MB", resolution: "8000 × 5333", modified: "May 13, 19:21", modifiedBy: "R. Avila", shared: true, sharedTo: ["AE", "JD"], versions: 11 },
  { id: "f05", name: "AESOP_Aura_BTS_Stills.zip", type: "image", version: "v1", versionFinal: false, size: "1.87 GB", resolution: "—", modified: "May 13, 14:55", modifiedBy: "P. Yi", shared: false, sharedTo: [], versions: 1 },
  { id: "f06", name: "AESOP_Aura_Score_Stems.zip", type: "audio", version: "v2", versionFinal: false, size: "342 MB", duration: "—", modified: "May 12, 11:02", modifiedBy: "T. Aldana", shared: true, sharedTo: ["AE"], versions: 2 },
  { id: "f07", name: "AESOP_Aura_VO_FR.wav", type: "audio", version: "v4", versionFinal: false, size: "186 MB", duration: "0:34", modified: "May 11, 18:30", modifiedBy: "T. Aldana", shared: false, sharedTo: [], versions: 4 },
  { id: "f08", name: "AESOP_Aura_DeliverySpec.pdf", type: "doc", version: "v1", versionFinal: false, size: "1.2 MB", modified: "May 09, 09:14", modifiedBy: "Liam F.", shared: true, sharedTo: ["AE"], versions: 1 },
  { id: "f09", name: "AESOP_Aura_Storyboard.ai", type: "image", version: "v_FINAL", versionFinal: true, size: "84 MB", modified: "Apr 28, 17:50", modifiedBy: "R. Avila", shared: false, sharedTo: [], versions: 6 },
];

export const SHARE_LINKS: ShareLink[] = [
  { id: "sl1", name: "Aesop · Final Delivery", url: "lf.studio/s/aesop-aura-final", project: "Aesop · Aura Campaign", projectCode: "LF-2026-091", files: 4, views: 12, downloads: 7, created: "May 13", expires: "May 27", expiresIn: "in 11 days", protected: true, revoked: false },
  { id: "sl2", name: "Polestar · Hero Cut v6 review", url: "lf.studio/s/polestar-quiet-v6", project: "Polestar · Quiet Drive", projectCode: "LF-2026-088", files: 1, views: 4, downloads: 1, created: "May 14", expires: "May 19", expiresIn: "in 3 days", protected: true, revoked: false },
  { id: "sl3", name: "Glossier · Master deliverables", url: "lf.studio/s/glossier-you-master", project: "Glossier · You Re-Launch", projectCode: "LF-2026-079", files: 12, views: 38, downloads: 22, created: "May 02", expires: "Jun 02", expiresIn: "in 17 days", protected: false, revoked: false },
  { id: "sl4", name: "Aesop · Mid-edit feedback", url: "lf.studio/s/aesop-aura-mid", project: "Aesop · Aura Campaign", projectCode: "LF-2026-091", files: 2, views: 7, downloads: 0, created: "May 08", expires: "May 22", expiresIn: "in 6 days", protected: true, revoked: false },
];

export const FILE_VERSIONS: FileVersion[] = [
  { tag: "v7", current: true, label: "Color pass 02 + audio mix", by: "Liam Fenwick", when: "May 14, 16:42", size: "2.41 GB", note: "Final color from Company3. Stems remixed by Telmo." },
  { tag: "v6", current: false, label: "Color pass 01", by: "Liam Fenwick", when: "May 13, 21:08", size: "2.38 GB" },
  { tag: "v5", current: false, label: "Picture lock", by: "Liam Fenwick", when: "May 12, 14:30", size: "2.36 GB" },
  { tag: "v4", current: false, label: "Director's notes", by: "Liam Fenwick", when: "May 10, 18:11", size: "2.20 GB" },
  { tag: "v3", current: false, label: "Internal review cut", by: "P. Yi", when: "May 08, 12:45", size: "2.18 GB" },
  { tag: "v2", current: false, label: "Rough assembly", by: "P. Yi", when: "May 06, 15:02", size: "2.14 GB" },
  { tag: "v1", current: false, label: "Selects", by: "P. Yi", when: "May 05, 09:50", size: "1.92 GB" },
];
