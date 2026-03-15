import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileContainer from "@/components/layout/MobileContainer";

export default function NotFound() {
  return (
    <>
      <Header />
      <MobileContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-[72px] mb-4">👻</div>
          <h1 className="font-display text-[28px] text-teal mb-3">
            도깨비가 길을 잃었어!
          </h1>
          <p className="text-text-secondary mb-8 text-[15px]">
            찾는 페이지가 없다… 도깨비도 당황했다!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal/10 text-teal border border-teal/20 rounded-xl hover:bg-teal/20 transition-colors font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </MobileContainer>
      <Footer />
    </>
  );
}
