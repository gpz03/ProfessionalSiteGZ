import { skills } from "@/data/resume";

export default function Skills() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="skills-page-heading">
          Skills
        </h1>
        <p className="text-muted-foreground">
          A technical snapshot — organized by category.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="skills-grid">
        {Object.entries(skills).map(([category, items]) => (
          <div
            key={category}
            data-testid={`skill-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
            className="border border-border rounded-lg p-5 bg-card"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4" data-testid={`skill-category-heading-${category}`}>
              {category}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((skill) => (
                <li
                  key={skill}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
