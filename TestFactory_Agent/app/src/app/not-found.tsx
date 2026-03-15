import Link from "next/link";
import Header from "@/components/layout/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="px-4 py-20 text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="font-fun text-xl text-text-primary mb-2">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          주소가 잘못되었거나, 삭제된 페이지예요.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-primary px-6 py-3 font-bold text-white hover:opacity-90"
        >
          홈으로 돌아가기
        </Link>
      </main>
    </>
  );
}
