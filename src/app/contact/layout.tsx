import Header from "@/components/Header";

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
}
