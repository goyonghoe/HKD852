import { MDXRemote } from "next-mdx-remote/rsc";
import { getArchitecture } from "@/lib/mdx";

export default async function ArchitecturePage() {
  const data = getArchitecture();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Architecture
      </h1>
      {data?.content ? (
        <div className="prose">
          <MDXRemote source={data.content} />
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Add <code>content/architecture.mdx</code> to populate this page.
        </p>
      )}
    </div>
  );
}
