"use client";

import { useState } from "react";
import Link from "next/link";
import { diagnoseIssue } from "@/app/actions";
import { createJobWithDiagnosis } from "@/lib/demo-db";
import { JobDiagnosis } from "@/lib/types";

type Chat = { role: "user" | "assistant"; text: string };
const naira = (value: number) => `N${value.toLocaleString()}`;

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Chat[]>([
    { role: "assistant", text: "Hi, this is FixMate. Tell me what is wrong, for example: My generator is smoking." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMessages((items) => [...items, { role: "user", text }]);
    setLoading(true);
    const diagnosis: JobDiagnosis = await diagnoseIssue(text, null);
    const saved = createJobWithDiagnosis({ description: text, imageProvided: false, location: "Lagos, Nigeria", diagnosis });
    setMessages((items) => [
      ...items,
      {
        role: "assistant",
        text: `${diagnosis.safety_warning ? `Safety: ${diagnosis.safety_warning}\n\n` : ""}${diagnosis.summary}\n\nCategory: ${diagnosis.artisan_category}\nEstimate: ${naira(diagnosis.estimated_min_naira)} - ${naira(diagnosis.estimated_max_naira)}\nJob saved: ${saved.job.id}\n\nReply by visiting /report to choose an artisan and book with simulated OPay escrow.`,
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#e5ddd5] font-sans flex flex-col">
      <header className="bg-green-700 text-white px-4 py-4 shadow flex justify-between items-center">
        <div>
          <h1 className="font-bold">FixMate WhatsApp Demo</h1>
          <p className="text-xs text-green-100">Gemini diagnosis assistant</p>
        </div>
        <Link href="/" className="text-sm">Home</Link>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 flex flex-col">
        <div className="flex-1 space-y-3 pb-4">
          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-none p-3 text-sm whitespace-pre-wrap shadow ${msg.role === "user" ? "bg-green-100 text-gray-900" : "bg-white text-gray-900"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <div className="bg-white rounded-none p-3 text-sm shadow w-fit">Gemini is checking safety and cost...</div>}
        </div>
        <div className="bg-white p-3 flex gap-2 border border-gray-200 rounded-none">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 border border-gray-300 rounded-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600" placeholder="My generator is smoking" />
          <button onClick={send} disabled={loading} className="px-5 bg-green-700 text-white rounded-none font-bold disabled:opacity-50">Send</button>
        </div>
      </main>
    </div>
  );
}
