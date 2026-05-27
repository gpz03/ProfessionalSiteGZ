import { person } from "@/data/resume";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Contact() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="contact-page-heading">
          Contact
        </h1>
        <p className="text-muted-foreground">
          Open to entry-level IT roles in system administration, network operations, or infrastructure support.
        </p>
      </div>

      <div className="max-w-md flex flex-col gap-4" data-testid="contact-links">
        <a
          href={`mailto:${person.email}`}
          data-testid="contact-email"
          className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:border-primary/40 hover:bg-muted/50 transition-all group"
        >
          <div className="p-2.5 rounded-md bg-primary/10 text-primary">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {person.email}
            </p>
          </div>
        </a>

        <a
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="contact-linkedin"
          className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:border-primary/40 hover:bg-muted/50 transition-all group"
        >
          <div className="p-2.5 rounded-md bg-primary/10 text-primary">
            <FaLinkedin size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">LinkedIn</p>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {person.linkedin.replace("https://", "")}
            </p>
          </div>
        </a>

        <a
          href={person.github}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="contact-github"
          className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card hover:border-primary/40 hover:bg-muted/50 transition-all group"
        >
          <div className="p-2.5 rounded-md bg-primary/10 text-primary">
            <FaGithub size={18} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">GitHub</p>
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {person.github.replace("https://", "")}
            </p>
          </div>
        </a>
      </div>
    </main>
  );
}
