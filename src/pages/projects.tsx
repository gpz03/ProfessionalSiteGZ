import { projects } from "@/data/resume";
import { Terminal, CheckCircle2, CircleDashed } from "lucide-react";
import AzurePlayground from "@/components/AzurePlayground";
import ProxmoxLabViewer from "@/components/ProxmoxLabViewer";

export default function Projects() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 lg:py-20 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      <div className="mb-14">
        <p className="text-sm font-mono text-primary mb-3">~/workspace/projects</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4" data-testid="projects-page-heading">
          Projects
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed" data-testid="projects-page-subheading">
          Hands-on labs and builds. Currently in Phase 1 — projects are actively being built to simulate enterprise IT environments.
        </p>
      </div>

      <div className="flex flex-col gap-12" data-testid="projects-list">
        {projects.map((p, index) => (
          <article
            key={p.id}
            data-testid={`project-${p.id}`}
            className="relative border border-border/60 rounded-2xl p-6 sm:p-8 md:p-10 bg-card overflow-hidden group hover:border-primary/30 hover:shadow-lg transition-all duration-300"
          >
            {/* Subtle background gradient for each card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 mb-8 border-b border-border/40 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary hidden sm:block">
                  <Terminal size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors" data-testid={`project-heading-${p.id}`}>
                    {p.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {p.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-mono font-medium bg-muted px-2.5 py-1 rounded-md text-foreground border border-border/50"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div
                data-testid={`project-badge-${p.id}`}
                className={`inline-flex items-center gap-1.5 text-sm font-mono font-medium px-3 py-1.5 rounded-full border ${
                  p.status === "In Progress"
                    ? "bg-primary/5 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {p.status === "In Progress" ? <CircleDashed size={14} className="animate-spin-slow" /> : <CheckCircle2 size={14} />}
                {p.status}
              </div>
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary/40 rounded-full" /> Overview
                  </h3>
                  <p className="text-base text-foreground/90 leading-relaxed">{p.overview}</p>
                </div>

                <div>
                  <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary/40 rounded-full" /> Goal
                  </h3>
                  <p className="text-base text-foreground/90 leading-relaxed">{p.goal}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary/40 rounded-full" /> Result / Status
                  </h3>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm text-foreground/90 leading-relaxed">
                    {p.result}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary/40 rounded-full" /> What I Did / Plan to Do
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {p.whatIDid.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-foreground/90">
                        <span className="mt-1.5 p-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0">
                          <CheckCircle2 size={12} />
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary/40 rounded-full" /> Key Takeaways
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {p.takeaways.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-foreground/90">
                        <span className="mt-1.5 p-0.5 rounded-full bg-primary/20 text-primary flex-shrink-0">
                          <CheckCircle2 size={12} />
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {p.id === "cloud-lab" && (
              <div className="relative z-10 mt-8 pt-8 border-t border-border/40">
                <AzurePlayground />
              </div>
            )}

            {p.id === "ad-homelab" && (
              <div className="relative z-10 mt-8 pt-8 border-t border-border/40">
                <ProxmoxLabViewer />
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
