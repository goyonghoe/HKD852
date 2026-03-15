interface MobileContainerProps {
  children: React.ReactNode;
}

export default function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mx-auto max-w-mobile min-h-screen bg-bg relative">
      {children}
    </div>
  );
}
