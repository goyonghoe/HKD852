import { ALL_SKILLS } from "@/lib/data";
import SkillTable from "@/components/SkillTable";

export default function SkillsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        Skill Directory
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        {ALL_SKILLS.length} skills across all agents
      </p>
      <SkillTable skills={ALL_SKILLS} />
    </div>
  );
}
