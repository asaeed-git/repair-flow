import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = { title: "RepairFlow | Repair workspace", description: "A clearer way to manage your repair shop." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><aside><Link className="brand" href="/"><b>R↗</b> RepairFlow<span>.</span></Link><p className="nav-label">WORKSPACE</p><nav aria-label="Main navigation">{[["/","Overview"],["/tickets","Repair tickets"],["/technicians","Technicians"],["/inventory","Parts inventory"],["/dashboard","Dashboard"],["/search","Search repairs"]].map(([url,label])=><Link key={url} href={url}>{label}</Link>)}</nav><div className="team"><b>AB</b><div>Abbas & Arhan<small>RepairFlow team</small></div></div></aside><div className="shell"><header>Workspace <span>/</span> RepairFlow <small>TEAM WORKSPACE</small></header><main>{children}</main></div></body></html>;
}
