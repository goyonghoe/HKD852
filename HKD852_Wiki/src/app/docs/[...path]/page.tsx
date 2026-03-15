import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { getDocsTree, getDocFile, getAllDocPaths, getSubtree } from "@/lib/docs";
import FileTree from "@/components/FileTree";

export function generateStaticParams() {
  return getAllDocPaths().map((segments) => ({ path: segments }));
}

export default async function DocFilePage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: pathSegments } = await params;
  const joinedPath = pathSegments.join("/");
  const doc = getDocFile(pathSegments);

  if (!doc) {
    notFound();
  }

  const tree = getDocsTree();
  const topFolder = pathSegments[0];
  const subtree = getSubtree(tree, topFolder);

  const breadcrumbs = [
    { label: "Docs", href: "/docs" },
    ...pathSegments.map((seg, i) => ({
      label: seg,
      href:
        i === pathSegments.length - 1
          ? ""
          : `/docs/${pathSegments.slice(0, i + 1).join("/")}`,
    })),
  ];

  return (
    <div className="flex gap-6">
      {/* Sidebar file tree */}
      {subtree && (
        <aside
          className="hidden lg:block w-56 shrink-0 overflow-y-auto sticky top-0 h-screen pt-4"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
        >
          <div
            className="rounded-lg p-3 border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {topFolder}
            </p>
            <FileTree
              tree={subtree.children ?? []}
              currentPath={joinedPath}
            />
          </div>
        </aside>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-sm mb-4">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span style={{ color: "var(--text-secondary)" }}>/</span>
              )}
              {bc.href ? (
                <a
                  href={bc.href}
                  style={{ color: "var(--accent)" }}
                  className="hover:underline"
                >
                  {bc.label}
                </a>
              ) : (
                <span style={{ color: "var(--text-primary)" }}>{bc.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="prose">
          <MDXRemote source={doc.content} options={{ mdxOptions: { format: "md" } }} />
        </div>
      </div>
    </div>
  );
}
