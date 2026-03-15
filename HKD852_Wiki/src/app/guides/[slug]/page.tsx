import { MDXRemote } from "next-mdx-remote/rsc";
import { getGuide } from "@/lib/mdx";
import { notFound } from "next/navigation";

const GUIDE_SLUGS = ["new-agent", "conventions", "reporting"];

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const title = (guide.frontmatter?.title as string) ?? slug;

  return (
    <div>
      <a
        href="/guides"
        className="text-sm mb-4 inline-block"
        style={{ color: "var(--accent)" }}
      >
        &larr; All Guides
      </a>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <div className="prose">
        <MDXRemote source={guide.content} />
      </div>
    </div>
  );
}
