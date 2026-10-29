"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Part } from "@prisma/client";
import { z } from "zod";
import { Button, Card, Input } from "@/components/ui";
import type { ApiError, ApiResult, Paginated } from "@/lib/contracts";
import { createPartSchema, updatePartSchema } from "./validation";
import styles from "./inventory.module.css";

type PartRecord = Omit<Part, "createdAt" | "updatedAt"> & { createdAt: string; updatedAt: string };
type FieldErrors = Record<string, string[] | undefined>;
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export function InventoryWorkspace() {
  const [parts, setParts] = useState<Paginated<PartRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<PartRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch(`/api/parts?page=${page}&pageSize=20`, {
          cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unable to load inventory. Please try again.");
        const result: Paginated<PartRecord> = await response.json();
        if (!controller.signal.aborted) setParts(result);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Unable to load inventory");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, revision]);

  function openForm(part: PartRecord | null) {
    setEditing(part);
    setFormOpen(true);
    setNotice("");
  }

  function saved(part: PartRecord) {
    setNotice(`${part.name} saved. Available stock: ${part.quantity}.`);
    setFormOpen(false);
    setEditing(null);
    setRevision((value) => value + 1);
    if (!editing) setPage(1);
  }

  return <div className={styles.workspace}>
    <div className={styles.heading}>
      <div><p className="eyebrow">PARTS & SUPPLIES</p><h1>Parts inventory</h1><p className="lead">Keep parts ready, prices current, and stock accurate.</p></div>
      <Button type="button" disabled={saving} onClick={() => openForm(null)}>+ Add part</Button>
    </div>
    {notice && <div className={styles.success} role="status">{notice}</div>}
    {formOpen && <Card>
      <PartForm key={editing?.id ?? "new"} part={editing} onSaved={saved}
        onCancel={() => { setFormOpen(false); setEditing(null); }} onSaving={setSaving} />
    </Card>}
    <Card>
      <div className={styles.listHeading}>
        <div><h2>Spare parts</h2><span className={styles.muted}>{parts && !loading && !loadError ? `${parts.meta.total} registered ${parts.meta.total === 1 ? "part" : "parts"}` : "Inventory records"}</span></div>
        <Button type="button" className={styles.secondary} disabled={loading || saving} onClick={() => setRevision((value) => value + 1)}>Refresh</Button>
      </div>
      {loadError ? <div className={styles.error} role="alert">{loadError} Use Refresh to retry.</div>
        : loading ? <div className={styles.empty} role="status">Loading parts…</div>
        : parts?.data.length === 0 ? <div className={styles.empty}><h3>No parts yet</h3><p>Add your first spare part to start tracking stock.</p></div>
        : <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>Spare parts, current stock, unit prices, and low-stock thresholds</caption>
              <thead><tr><th scope="col">Part</th><th scope="col">Available</th><th scope="col">Unit price</th><th scope="col">Low-stock threshold</th><th scope="col"><span className={styles.srOnly}>Actions</span></th></tr></thead>
              <tbody>{parts?.data.map((part) => <tr key={part.id}>
                <td data-label="Part"><strong>{part.name}</strong><span className={styles.code}>{part.partCode}</span></td>
                <td data-label="Available"><span>{part.quantity}</span>{part.quantity < part.lowStockThreshold && <span className={styles.badge}>Low stock</span>}</td>
                <td data-label="Unit price">{money.format(part.unitPriceMinor / 100)}</td>
                <td data-label="Threshold">{part.lowStockThreshold}</td>
                <td><Button type="button" className={styles.secondary} disabled={saving} aria-label={`Edit ${part.name}`} onClick={() => openForm(part)}>Edit</Button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>Page {page} of {Math.max(1, Math.ceil((parts?.meta.total ?? 0) / 20))}</span>
            <div><Button type="button" className={styles.secondary} disabled={page === 1 || saving} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button type="button" className={styles.secondary} disabled={page * 20 >= (parts?.meta.total ?? 0) || saving} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
          </div>
        </>}
    </Card>
    <p className={styles.note}>Low stock means the available quantity is below the part’s threshold. Prices are in Indian rupees.</p>
  </div>;
}

function PartForm({ part, onSaved, onCancel, onSaving }: {
  part: PartRecord | null; onSaved: (part: PartRecord) => void; onCancel: () => void; onSaving: (saving: boolean) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const integer = (name: string) => /^[+-]?\d+$/.test(text(name)) ? Number(text(name)) : NaN;
    const price = text("unitPriceMinor");
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      setFieldErrors({ unitPriceMinor: ["Enter a nonnegative rupee amount with at most two decimal places"] });
      setError("Check the highlighted fields");
      return;
    }
    const [rupees, paise = ""] = price.split(".");
    const details = {
      partCode: text("partCode"), name: text("name"),
      unitPriceMinor: Number(rupees) * 100 + Number(paise.padEnd(2, "0")),
      lowStockThreshold: integer("lowStockThreshold"),
    };
    const parsed = part
      ? updatePartSchema.safeParse({ ...details, stockAdjustment: integer("stockAdjustment") })
      : createPartSchema.safeParse({ ...details, quantity: integer("quantity") });
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      setError("Check the highlighted fields");
      return;
    }
    submitting.current = true;
    setBusy(true);
    onSaving(true);
    try {
      const response = await fetch(part ? `/api/parts/${part.id}` : "/api/parts", {
        method: part ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: ApiResult<PartRecord> | ApiError = await response.json();
      if (!response.ok || "error" in result) {
        if ("error" in result) {
          setError(result.error.message);
          setFieldErrors(result.error.fieldErrors ?? {});
        } else setError("Unable to save this part");
        return;
      }
      onSaved(result.data);
    } catch {
      setError("The save could not be confirmed. Refresh inventory before retrying to avoid applying a stock change twice.");
    } finally {
      submitting.current = false;
      setBusy(false);
      onSaving(false);
    }
  }

  function field(name: string, label: string, defaultValue: string | number, options: {
    inputMode?: "text" | "numeric" | "decimal"; maxLength?: number; hint?: string;
  } = {}) {
    return <div className={styles.field}>
      <label htmlFor={`part-${name}`}>{label}</label>
      <Input id={`part-${name}`} name={name} defaultValue={defaultValue} required
        inputMode={options.inputMode} maxLength={options.maxLength}
        aria-invalid={Boolean(fieldErrors[name]?.length)}
        aria-describedby={`${options.hint ? `hint-${name} ` : ""}${fieldErrors[name]?.length ? `error-${name}` : ""}`.trim() || undefined} />
      {options.hint && <span id={`hint-${name}`} className={styles.hint}>{options.hint}</span>}
      {fieldErrors[name]?.length ? <span id={`error-${name}`} className={styles.fieldError}>{fieldErrors[name]?.join(". ")}</span> : null}
    </div>;
  }

  return <form ref={formRef} onSubmit={submit} noValidate aria-label={part ? "Edit part" : "Add part"}>
    <div className={styles.formHeading}><h2>{part ? "Edit part" : "Add a spare part"}</h2><span className={styles.muted}>All fields are required</span></div>
    {error && <div className={styles.error} role="alert">{error}</div>}
    <fieldset disabled={busy} className={styles.fields}>
      {field("name", "Part name", part?.name ?? "", { maxLength: 120 })}
      {field("partCode", "Part code", part?.partCode ?? "", { maxLength: 60, hint: "Unique code; saved in uppercase." })}
      {field("unitPriceMinor", "Unit price (₹)", part ? (part.unitPriceMinor / 100).toFixed(2) : "0.00", { inputMode: "decimal", hint: "For example, 2500.50." })}
      {part
        ? field("stockAdjustment", "Stock adjustment", "0", { inputMode: "text", hint: `${part.quantity} available when opened. Enter +2 to add, -1 to remove, or 0 to leave unchanged.` })
        : field("quantity", "Opening quantity", "0", { inputMode: "numeric", hint: "A whole number, zero or more." })}
      {field("lowStockThreshold", "Low-stock threshold", part?.lowStockThreshold ?? "0", { inputMode: "numeric", hint: "Flag this part when stock falls below this number." })}
    </fieldset>
    <div className={styles.actions}><Button type="submit" disabled={busy}>{busy ? "Saving…" : part ? "Save changes" : "Add part"}</Button>
      <Button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>Cancel</Button></div>
  </form>;
}
