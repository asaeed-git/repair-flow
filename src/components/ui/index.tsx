import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
 return <button className={`button ${className}`} {...props} />;
}
export function Card({ children }: { children: ReactNode }) { return <section className="card">{children}</section>; }
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
 return <input className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 ${className}`} {...props} />;
}
