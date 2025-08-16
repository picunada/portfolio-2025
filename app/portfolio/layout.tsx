import Navbar from "@/app/ui/navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="w-full h-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {children}
      </main>
      <Navbar />
    </div>
  )
}
