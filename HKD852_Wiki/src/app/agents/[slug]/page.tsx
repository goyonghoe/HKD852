import { MDXRemote } from "next-mdx-remote/rsc";
import { getAgent, getAllAgents } from "@/lib/mdx";
import { AGENTS } from "@/lib/data";
import Badge from "@/components/Badge";
import { notFound } from "next/navigation";

const DIVISION_COLORS: Record<string, string> = {
  "ceo-direct": "#f59e0b",
  game: "#10b981",
  business: "#8b5cf6",
  support: "#06b6d4",
};

export function generateStaticParams() {
  return AGENTS.map((a) => ({ slug: a.slug }));
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agentData = getAgent(slug);
  const staticAgent = AGENTS.find((a) => a.slug === slug);

  if (!agentData && !staticAgent) {
    notFound();
  }

  const name = agentData?.frontmatter?.name ?? staticAgent?.name ?? slug;
  const role = (agentData?.frontmatter?.role as string) ?? staticAgent?.role ?? "";
  const division = (agentData?.frontmatter?.division as string) ?? staticAgent?.division ?? "ceo-direct";
  const description = (agentData?.frontmatter?.description as string) ?? staticAgent?.description ?? "";
  const divColor = DIVISION_COLORS[division] ?? "#6b7280";

  return (
    <div>
      <a
        href="/agents"
        className="text-sm mb-4 inline-block"
        style={{ color: "var(--accent)" }}
      >
        &larr; All Agents
      </a>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {name as string}
          </h1>
          <Badge label={division} color={divColor} />
        </div>
        <p className="text-sm" style={{ color: "var(--accent)" }}>
          {role}
        </p>
        {description && (
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>

      {agentData?.content ? (
        <div className="prose">
          <MDXRemote source={agentData.content} />
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No detailed documentation available yet. Add a file at{" "}
          <code>content/agents/{slug}.mdx</code> to populate this page.
        </p>
      )}

      {staticAgent?.path && (
        <a
          href={`/docs/${staticAgent.path.replace(/^\.\//, "").replace(/\/$/, "")}`}
          className="inline-block mt-6 text-sm"
          style={{ color: "var(--accent)" }}
        >
          Browse all documents for this agent &rarr;
        </a>
      )}
    </div>
  );
}
