import { Link } from "wouter";
import { ArrowRight, Github, Linkedin, ExternalLink, Server, Activity, Shield, Terminal } from "lucide-react";
import { person, highlights, projects } from "@/data/resume";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="max-w-3xl relative">
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6" data-testid="hero-eyebrow">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Available for Entry-Level IT Roles
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight" data-testid="hero-name">
            {person.name}
          </h1>
          
          <p className="text-xl sm:text-2xl font-mono text-muted-foreground mb-4" data-testid="hero-title">
            <span className="text-primary">&gt;</span> {person.title}
          </p>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl" data-testid="hero-tagline">
            Hands-on experience building and managing Windows Server environments, with a focus on system administration, network operations, and automation.
          </p>

          <div className="flex flex-wrap gap-4 mb-12" data-testid="hero-cta-group">
            <Link
              href="/projects"
              data-testid="cta-view-projects"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              View Projects <ArrowRight size={16} />
            </Link>
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="cta-github"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border rounded-md text-sm font-medium text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all shadow-2xs hover:shadow-sm"
            >
              <Github size={16} /> GitHub
            </a>
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="cta-linkedin"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-border rounded-md text-sm font-medium text-foreground hover:border-primary/50 hover:bg-muted/50 transition-all shadow-2xs hover:shadow-sm"
            >
              <Linkedin size={16} /> LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Highlights - Terminal Style */}
      <section className="border-y border-border/40 bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out fill-mode-both">
          <div className="flex items-center gap-3 mb-8">
            <Server className="text-primary" size={24} />
            <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-foreground" data-testid="highlights-heading">
              System Highlights
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6" data-testid="highlights-list">
            {highlights.map((h, i) => (
              <div
                key={i}
                data-testid={`highlight-item-${i}`}
                className="flex items-start gap-4 p-5 rounded-lg border border-border/50 bg-card shadow-sm hover:border-primary/30 transition-colors group"
              >
                <div className="mt-0.5 p-2 rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {i % 3 === 0 ? <Server size={16} /> : i % 3 === 1 ? <Activity size={16} /> : <Shield size={16} />}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                  {h}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-20 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 ease-out fill-mode-both">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-mono text-primary mb-2">~/workspace/projects</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" data-testid="projects-section-heading">
              Current Focus
            </h2>
          </div>
          <Link
            href="/projects"
            data-testid="link-all-projects"
            className="text-sm font-medium text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 transition-colors pb-1"
          >
            View all <ExternalLink size={14} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6" data-testid="projects-grid">
          {projects.map((p, i) => (
            <div
              key={p.id}
              data-testid={`project-card-${p.id}`}
              className="group flex flex-col border border-border/60 rounded-xl p-6 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Terminal size={18} />
                </div>
                <span
                  data-testid={`project-status-${p.id}`}
                  className={`text-xs font-mono font-medium px-2.5 py-1 rounded border ${
                    p.status === "In Progress"
                      ? "bg-primary/5 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors" data-testid={`project-title-${p.id}`}>
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {p.overview}
              </p>
              
              <div className="mt-6 pt-4 border-t border-border/40 flex flex-wrap gap-2">
                {p.technologies.slice(0, 2).map(t => (
                  <span key={t} className="text-[11px] font-mono bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                    {t}
                  </span>
                ))}
                {p.technologies.length > 2 && (
                  <span className="text-[11px] font-mono bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                    +{p.technologies.length - 2}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
