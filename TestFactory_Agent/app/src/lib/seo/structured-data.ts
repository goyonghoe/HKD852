/**
 * JSON-LD structured data generator for quiz/test pages.
 * Uses Schema.org Quiz type for rich search results.
 */

export interface TestDefinition {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  imageUrl?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}

interface JsonLdQuiz {
  "@context": "https://schema.org";
  "@type": "Quiz";
  name: string;
  description: string;
  about: {
    "@type": "Thing";
    name: string;
  };
  educationalAlignment?: {
    "@type": "AlignmentObject";
    alignmentType: string;
    targetName: string;
  };
  numberOfQuestions: number;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    "@type": "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
  };
}

/**
 * Generate JSON-LD structured data for a quiz/test page.
 */
export function generateQuizJsonLd(test: TestDefinition): JsonLdQuiz {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://example.com";

  const jsonLd: JsonLdQuiz = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: test.title,
    description: test.description,
    about: {
      "@type": "Thing",
      name: test.title,
    },
    numberOfQuestions: test.questionCount,
    publisher: {
      "@type": "Organization",
      name: "HKD852 Studio",
      url: baseUrl,
    },
  };

  if (test.imageUrl) {
    jsonLd.image = test.imageUrl;
  }

  if (test.datePublished) {
    jsonLd.datePublished = test.datePublished;
  }

  if (test.dateModified) {
    jsonLd.dateModified = test.dateModified;
  }

  if (test.author) {
    jsonLd.author = {
      "@type": "Organization",
      name: test.author,
    };
  }

  return jsonLd;
}

/**
 * Serialize the structured data to a string suitable for embedding
 * in a <script type="application/ld+json"> tag.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 0);
}
