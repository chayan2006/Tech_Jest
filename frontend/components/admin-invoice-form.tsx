"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

export function AdminInvoiceForm({ projectId, requestId }: { projectId: string; requestId: string | null }) {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [status, setStatus] = useState("draft");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await createClient()
      .from("invoices")
      .insert({
        project_id: projectId,
        request_id: requestId,
        number: invoiceNumber.trim(),
        amount: Number(amount),
        currency,
        status,
        due_date: dueDate || null,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      });
    if (error) {
      setMessage(error.code === "23505" ? "That invoice number already exists." : "Could not save the invoice.");
    } else {
      setInvoiceNumber("");
      setAmount("");
      setDueDate("");
      setMessage(status === "draft" ? "Draft invoice saved. Clients see it once it is marked sent." : "Invoice saved.");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <div className="admin-form-grid">
        <label>
          Invoice number
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            required
            maxLength={40}
            placeholder="TJ-2026-001"
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
      </div>
      <div className="admin-form-grid">
        <label>
          Currency
          <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </label>
      </div>
      <label>
        Due date
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>
      {!requestId && (
        <p className="admin-message">
          This project is not linked to a client request, so no client will see this invoice.
        </p>
      )}
      <button className="btn btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Add invoice"}
      </button>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
