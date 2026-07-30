import { useState } from "react";
import HomePage from "@/Home.tsx"
import APIPage from "@/API.tsx"
import ExamplePage from "@/ExamplePage.tsx"

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home")

  const setTab = (tab: string) => setActiveTab(tab)

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 selection:text-primary">

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold tracking-tight text-lg leading-none">ics-suite</span>
              <span className="font-mono text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full font-medium w-fit">
                peerDep: temporal-polyfill
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === "api"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTab("example")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === "example"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Example
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === "home" && (<HomePage setTab={setTab} />)}
        {activeTab === "api" && (<APIPage />)}
        {activeTab === "example" && (<ExamplePage />)}
      </main>
    </div>
  );
}