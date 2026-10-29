import Link from "next/link";
const modules = [
 ["01","Repair tickets","Every device. Every detail. One clear repair journey.","Abbas","tickets"],
 ["02","Technicians","Connect the right repair with the right pair of hands.","Abbas","technicians"],
 ["03","Parts inventory","Keep essential parts ready for the next repair.","Arhan","inventory"],
 ["04","Shop insights","A clear picture of your workload and stock levels.","Arhan","dashboard"]
];
export default function Home() {
 return <><p className="eyebrow">YOUR REPAIR WORKSPACE</p><h1>A smoother day at the shop.</h1><p className="lead">From the first diagnosis to the final pickup, keep your team on the same page.</p><section className="welcome"><div><span className="pill">Foundation ready</span><h2>Great repairs start<br/>with a clear workflow.</h2><p>Your shared workspace is taking shape. Ticket management and technician assignments are the next milestone.</p></div><div className="workflow" aria-label="Repair workflow">{["New","In progress","Ready for pickup","Delivered"].map((s,i)=><div key={s}><b>{i+1}</b>{s}</div>)}</div></section><div className="section-title"><h2>Your workspace</h2><span>Built together · Abbas & Arhan</span></div><section className="cards">{modules.map(([number,title,description,owner,route])=><Link className="card" key={number} href={"/"+route}><div className="card-top"><b>{number}</b><span>↗</span></div><h3>{title}</h3><p>{description}</p><footer><span>{owner}</span><span>Planned</span></footer></Link>)}</section><p className="footnote">Foundation preview · Live records will appear once the database and repair modules are connected.</p></>;
}
