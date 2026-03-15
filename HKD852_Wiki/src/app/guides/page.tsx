const GUIDES = [
  {
    slug: "new-agent",
    title: "New Agent Setup",
    description: "How to create a new agent with CLAUDE.md, skills, and folder structure.",
  },
  {
    slug: "conventions",
    title: "Conventions & Standards",
    description: "Naming conventions, skill YAML frontmatter, model selection, and quality pipeline.",
  },
  {
    slug: "reporting",
    title: "Reporting Format",
    description: "Standard execution summary format for all task completions.",
  },
];

export default function GuidesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Guides
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Reference guides for working with HKD852 agents and skills.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GUIDES.map((guide) => (
          <a
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block rounded-lg border p-4 transition-colors"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--text-primary)" }}>
              {guide.title}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {guide.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
