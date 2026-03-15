import { notFound } from "next/navigation";
import { getAllTests, getTestBySlug } from "@/lib/tests/loader";
import TestEngine from "@/components/test/TestEngine";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllTests().map((t) => ({ slug: t.meta.slug }));
}

export default async function TestPlayPage({ params }: Props) {
  const { slug } = await params;
  const test = getTestBySlug(slug);
  if (!test) notFound();

  return <TestEngine test={test} slug={slug} />;
}
