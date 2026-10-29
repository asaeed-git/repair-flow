import Link from "next/link";
import { notFound } from "next/navigation";
const entries: Record<string,[string,string]> = { tickets:["Repair tickets","Abbas"],technicians:["Technicians","Abbas"],inventory:["Parts inventory","Arhan"],dashboard:["Shop insights","Arhan"],search:["Search repairs","Arhan"] };
export default async function ModulePage({params}:{params:Promise<{module:string}>}) {
 const entry=entries[(await params).module]; if(!entry) notFound();
 return <><p className="eyebrow">WORKSPACE</p><h1>{entry[0]}</h1><section className="empty"><span className="pill">Planned module</span><h2>A place for your next repair.</h2><p className="lead">This module is assigned to {entry[1]}. Live records and actions will be added in the next development milestones.</p><Link className="button" href="/">Back to overview</Link></section></>;
}
