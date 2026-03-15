import Board from "@/components/board/Board";
import MobileTasks from "@/components/mobile/MobileTasks";

export default function TasksPage() {
  return (
    <>
      {/* Desktop: show Board (same as home) */}
      <div className="hidden sm:block">
        <Board />
      </div>
      {/* Mobile: show MobileTasks */}
      <div className="block sm:hidden">
        <MobileTasks />
      </div>
    </>
  );
}
