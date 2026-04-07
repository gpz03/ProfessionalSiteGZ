import { person, education } from "@/data/resume";
import { Link } from "wouter";

export default function About() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="about-page-heading">
          About
        </h1>
      </div>

      <div className="max-w-2xl">
        {/* Bio */}
        <section className="mb-10">
          <p className="text-base text-foreground leading-relaxed mb-4" data-testid="about-bio-1">
            I'm {person.name}, an Information Technology undergraduate at UMass Boston (graduating Spring 2026), specializing in System and Network Administration with a minor in Management.
          </p>
          <p className="text-base text-foreground leading-relaxed mb-4" data-testid="about-bio-2">
            My technical focus is on enterprise IT infrastructure — Windows Server, Active Directory, networking fundamentals, and the automation that ties it all together. I'm drawn to the operational side of IT: making systems reliable, environments manageable, and processes efficient.
          </p>
          <p className="text-base text-foreground leading-relaxed mb-4" data-testid="about-bio-3">
            Outside of class, I've built hands-on experience through an IT internship at South Shore Charter Public School, two years in tech services at Staples, and a current role at Best Buy where I handle both sales and shift leadership. I've also completed a study abroad semester in Darmstadt, Germany, where I met with technology and innovation leaders in the region.
          </p>
          <p className="text-base text-foreground leading-relaxed" data-testid="about-bio-4">
            I'm actively building lab environments and automation scripts to deepen my skills while looking for an entry-level IT role in system administration, network operations, or infrastructure support.
          </p>
        </section>

        {/* Learning Goals */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4" data-testid="about-learning-heading">
            Currently Learning / Building
          </h2>
          <ul className="flex flex-col gap-2" data-testid="about-learning-list">
            {[
              "Active Directory home lab — domain setup, Group Policy, user provisioning",
              "Microsoft Azure fundamentals — VM deployment and cloud networking",
              "PowerShell scripting — automating common admin tasks",
              "Networking concepts — DNS, DHCP, VLANs, and firewall configuration",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="pt-2">
          <Link
            href="/contact"
            data-testid="about-contact-cta"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </main>
  );
}
