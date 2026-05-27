import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Terminal } from "lucide-react";
import { person } from "@/data/resume";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/50 backdrop-blur-md shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        <Link 
          href="/" 
          data-testid="nav-logo" 
          className="flex items-center gap-2.5 font-mono font-bold text-xs sm:text-sm tracking-tight text-foreground hover:opacity-95 transition-opacity"
        >
          <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Terminal size={14} />
          </div>
          <span className="flex items-center">
            <span className="text-foreground">gavin.zola</span>
            <span className="text-primary font-bold">@</span>
            <span className="text-muted-foreground">portfolio</span>
            <span className="text-primary font-bold ml-1">~</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
                className={`text-[10px] font-bold font-mono tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 border-primary/25 text-primary shadow-sm shadow-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg border border-border bg-card/45 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setOpen(!open)}
          data-testid="nav-mobile-toggle"
          aria-label="Toggle navigation"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`nav-mobile-link-${link.label.toLowerCase()}`}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary/25 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
