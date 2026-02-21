"use client";

export default function MobileContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-6">
      {children}
    </div>
  );
}
