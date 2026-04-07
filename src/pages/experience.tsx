import { experience, education, courses, additionalExperience, personalProjects } from "@/data/resume";

export default function Experience() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="experience-page-heading">
          Experience
        </h1>
        <p className="text-muted-foreground">
          Applied experience across IT support, tech retail, and enterprise environments.
        </p>
      </div>

      {/* Work Experience */}
      <section className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6" data-testid="work-experience-heading">
          Work Experience
        </h2>
        <div className="flex flex-col gap-8" data-testid="work-experience-list">
          {experience.map((job) => (
            <div
              key={job.id}
              data-testid={`job-${job.id}`}
              className="border-l-2 border-primary/30 pl-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-semibold text-foreground" data-testid={`job-title-${job.id}`}>
                    {job.title}
                  </h3>
                  <p className="text-sm text-primary font-medium" data-testid={`job-company-${job.id}`}>
                    {job.company} — {job.location}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-medium" data-testid={`job-dates-${job.id}`}>
                  {job.dates}
                </span>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {job.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
                  >
                    <span className="mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Personal IT Projects */}
      <section className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6" data-testid="personal-projects-heading">
          Personal IT Projects
        </h2>
        <div className="flex flex-col gap-5" data-testid="personal-projects-list">
          {personalProjects.map((p, i) => (
            <div key={i} data-testid={`personal-project-${i}`} className="border-l-2 border-primary/30 pl-5">
              <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6" data-testid="education-heading">
          Education
        </h2>
        <div className="flex flex-col gap-8" data-testid="education-list">
          {education.map((edu, i) => (
            <div key={i} data-testid={`education-${i}`} className="border-l-2 border-primary/30 pl-5">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-semibold text-foreground">{edu.institution}</h3>
                  <p className="text-sm text-primary font-medium">{edu.degree}</p>
                  {edu.minor && (
                    <p className="text-xs text-muted-foreground">{edu.minor}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{edu.dates}</span>
              </div>
              {edu.notes && edu.notes.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {edu.notes.map((note, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section className="mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6" data-testid="courses-heading">
          Relevant Coursework
        </h2>
        <ul className="flex flex-wrap gap-2" data-testid="courses-list">
          {courses.map((course) => (
            <li
              key={course}
              className="text-sm bg-muted px-3 py-1.5 rounded-md text-foreground"
            >
              {course}
            </li>
          ))}
        </ul>
      </section>

      {/* Additional Experience */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6" data-testid="additional-experience-heading">
          Additional Notes
        </h2>
        <ul className="flex flex-col gap-2" data-testid="additional-experience-list">
          {additionalExperience.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
