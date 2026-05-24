import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Server, Mail, BookOpen, Briefcase, Wrench, 
  ChevronDown, ChevronUp, Terminal, Activity, 
  Shield, Cpu, HardDrive, Play, ArrowRight, ExternalLink
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { person, projects, experience, skills, education, courses, additionalExperience, personalProjects } from "@/data/resume";
import ProxmoxLabViewer from "@/components/ProxmoxLabViewer";
import ActiveDirectoryExplorer from "@/components/ActiveDirectoryExplorer";
import NasExplorer from "@/components/NasExplorer";
import PipelineVisualizer from "@/components/PipelineVisualizer";

export default function Home() {
  const [location, setLocation] = useLocation();
  const [isResumeExpanded, setIsResumeExpanded] = useState<boolean>(false);

  // Sync wouter URLs with dashboard state
  useEffect(() => {
    if (["/experience", "/skills", "/about", "/contact"].includes(location)) {
      setIsResumeExpanded(true);
      // Wait for state expansion update, then scroll smoothly to the target section
      setTimeout(() => {
        const id = location.replace("/", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    } else if (location === "/projects") {
      // Scroll to first lab project
      const element = document.getElementById("ad-homelab-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location]);

  // Find project details from resume data
  const getProjectData = (id: string) => {
    return projects.find((p) => p.id === id);
  };

  const adProject = getProjectData("ad-homelab");
  const nasProject = getProjectData("nas-storage");
  const cicdProject = getProjectData("cloud-lab");

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-16 min-h-[calc(100vh-4rem)]">
      
      {/* 1. HERO HEADER */}
      <section className="relative border border-border/50 rounded-2xl bg-card/40 backdrop-blur-md p-6 sm:p-8 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-mono font-bold tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              SYSTEM STATUS: ONLINE
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-3">
              {person.name}
            </h1>
            <p className="text-base sm:text-lg font-mono text-muted-foreground">
              <span className="text-primary">&gt;</span> {person.title}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${person.email}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              <Mail size={14} className="text-primary" /> {person.email}
            </a>
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              <FaLinkedin size={14} className="text-primary" /> LinkedIn
            </a>
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              <FaGithub size={14} className="text-primary" /> GitHub
            </a>
          </div>
        </div>
      </section>

      {/* 2. LABS LIST (SCROLL VIEW WITH EXPLANATIONS WOVEN IN) */}
      <div className="flex flex-col gap-20">

        {/* LAB 1: HYPERVISOR & ACTIVE DIRECTORY */}
        {adProject && (
          <section id="ad-homelab-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-border/30 pb-16 scroll-mt-20">
            {/* Left Column: Woven Explanation */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">LAB 01 / Hypervisor Virt & AD</p>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{adProject.title}</h2>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{adProject.overview}</p>
                
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-1">Goal</h4>
                  <p>{adProject.goal}</p>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1">
                    {adProject.technologies.map((t) => (
                      <span key={t} className="text-[9px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Achievements</h4>
                  <ul className="space-y-1.5">
                    {adProject.whatIDid.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactables */}
            <div className="lg:col-span-8 space-y-6">
              <ProxmoxLabViewer />
              <ActiveDirectoryExplorer />
            </div>
          </section>
        )}

        {/* LAB 2: PERSONAL NAS STORAGE */}
        {nasProject && (
          <section id="nas-storage-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-border/30 pb-16 scroll-mt-20">
            {/* Left Column: Woven Explanation */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">LAB 02 / Network File Storage</p>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{nasProject.title}</h2>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{nasProject.overview}</p>
                
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-1">Goal</h4>
                  <p>{nasProject.goal}</p>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1">
                    {nasProject.technologies.map((t) => (
                      <span key={t} className="text-[9px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Achievements</h4>
                  <ul className="space-y-1.5">
                    {nasProject.whatIDid.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Live NAS Explorer */}
            <div className="lg:col-span-8">
              <NasExplorer />
            </div>
          </section>
        )}

        {/* LAB 3: CI/CD DEPLOYMENT PIPELINE */}
        {cicdProject && (
          <section id="cloud-lab-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-border/30 pb-16 scroll-mt-20">
            {/* Left Column: Woven Explanation */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">LAB 03 / Automation Pipeline</p>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{cicdProject.title}</h2>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{cicdProject.overview}</p>
                
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-1">Goal</h4>
                  <p>{cicdProject.goal}</p>
                </div>

                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Technologies Used</h4>
                  <div className="flex flex-wrap gap-1">
                    {cicdProject.technologies.map((t) => (
                      <span key={t} className="text-[9px] font-mono bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground mb-2">Achievements</h4>
                  <ul className="space-y-1.5">
                    {cicdProject.whatIDid.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Live CD Visualizer */}
            <div className="lg:col-span-8">
              <PipelineVisualizer />
            </div>
          </section>
        )}

      </div>

      {/* 3. PROFILE & EXPERIENCE ACCORDION */}
      <section className="border border-border/60 rounded-2xl bg-card/60 backdrop-blur-md overflow-hidden shadow-sm animate-in fade-in duration-500 delay-150 fill-mode-both">
        <button
          onClick={() => setIsResumeExpanded(!isResumeExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="text-primary" size={20} />
            <h2 className="text-base font-bold text-foreground">
              {isResumeExpanded ? "Hide Professional Resume & Profile" : "Expand Systems Profile & Resume Details"}
            </h2>
          </div>
          {isResumeExpanded ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </button>

        {isResumeExpanded && (
          <div className="p-6 sm:p-8 border-t border-border/40 space-y-12 animate-in slide-in-from-top-4 duration-300 ease-out">
            
            {/* About / Bio Section */}
            <div id="about" className="grid md:grid-cols-12 gap-8 scroll-mt-20">
              <div className="md:col-span-4">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-primary mb-2 flex items-center gap-2">
                  <BookOpen size={14} /> Profile / Bio
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Academic background, learning milestones, and regional study notes.
                </p>
              </div>

              <div className="md:col-span-8 space-y-4 text-sm sm:text-base text-foreground/80 leading-relaxed">
                <p>
                  I'm <strong>{person.name}</strong>, an Information Technology undergraduate at UMass Boston (graduating Spring 2026), specializing in System and Network Administration with a minor in Management.
                </p>
                <p>
                  My technical focus is on enterprise IT infrastructure — Windows Server, Active Directory, virtualization, and networking fundamentals. I enjoy building lab environments and scripting automated audits to make systems reliable and environments manageable.
                </p>
                
                {/* Education list */}
                <div className="pt-4 border-t border-border/30 space-y-4">
                  {education.map((edu, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-start flex-wrap gap-1">
                        <h4 className="font-semibold text-foreground text-sm">{edu.institution}</h4>
                        <span className="text-xs font-mono text-muted-foreground">{edu.dates}</span>
                      </div>
                      <p className="text-xs text-primary font-medium">{edu.degree} {edu.minor && `| ${edu.minor}`}</p>
                      {edu.notes && (
                        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5 mt-1">
                          {edu.notes.map((note, nIdx) => <li key={nIdx}>{note}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills Directory */}
            <div id="skills" className="grid md:grid-cols-12 gap-8 border-t border-border/30 pt-10 scroll-mt-20">
              <div className="md:col-span-4">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-primary mb-2 flex items-center gap-2">
                  <Wrench size={14} /> Technical Skills
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Snapshot of systems, utilities, and script automation environments.
                </p>
              </div>

              <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category} className="border border-border/40 rounded-lg p-4 bg-muted/10">
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary mb-2">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-medium bg-card px-2 py-0.5 border border-border/50 rounded-md text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Work History */}
            <div id="experience" className="grid md:grid-cols-12 gap-8 border-t border-border/30 pt-10 scroll-mt-20">
              <div className="md:col-span-4">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-primary mb-2 flex items-center gap-2">
                  <Briefcase size={14} /> Experience
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  IT diagnostics, hardware troubleshooting, and store leadership history.
                </p>
              </div>

              <div className="md:col-span-8 space-y-8">
                {experience.map((job) => (
                  <div key={job.id} className="border-l border-primary/20 pl-4 relative space-y-2">
                    <div className="absolute w-2 h-2 rounded-full bg-primary -left-[4.5px] top-1.5" />
                    
                    <div className="flex justify-between items-start flex-wrap gap-1">
                      <h4 className="font-semibold text-foreground text-sm">{job.title}</h4>
                      <span className="text-xs font-mono text-muted-foreground">{job.dates}</span>
                    </div>
                    <p className="text-xs text-primary font-medium">{job.company} — {job.location}</p>
                    
                    <ul className="space-y-1.5 mt-2">
                      {job.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Coursework & Additional notes */}
            <div className="grid md:grid-cols-12 gap-8 border-t border-border/30 pt-10">
              <div className="md:col-span-4">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-primary mb-2 flex items-center gap-2">
                  <Shield size={14} /> Coursework & Notes
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System security courses, PC donation projects, and support logs.
                </p>
              </div>

              <div className="md:col-span-8 space-y-6">
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Relevant IT Coursework
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {courses.map((course) => (
                      <span key={course} className="text-xs bg-muted/40 px-2.5 py-1 rounded text-foreground border border-border/40">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/20">
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Community Service Labs
                    </h4>
                    <ul className="space-y-2">
                      {personalProjects.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">{p.title}</strong>: {p.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Operational Tools & Notes
                    </h4>
                    <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {additionalExperience.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact links card */}
            <div id="contact" className="border-t border-border/30 pt-10 scroll-mt-20">
              <div className="p-6 rounded-xl border border-border/50 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-foreground text-base">Let's Connect</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seeking systems administration or infrastructure support opportunities.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${person.email}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Mail size={12} /> Contact Me
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>

    </main>
  );
}
