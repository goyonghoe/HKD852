import Board from "@/components/board/Board";
import MobileHome from "@/components/mobile/MobileHome";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      {/* Desktop: show Board */}
      <div className="hidden sm:block">
        <Board />
      </div>
      {/* Mobile: show MobileHome */}
      <div className="block sm:hidden">
        <MobileHome />
      </div>
    </ProtectedRoute>
  );
}
