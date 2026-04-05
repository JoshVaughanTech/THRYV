import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="text-center">
        <Zap className="h-12 w-12 text-[#B4F000] mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-[#888888] mb-8">This page doesn&apos;t exist</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#B4F000] px-6 py-3 text-sm font-bold text-[#0A0A0A] transition-all hover:bg-[#C5F53A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back Home
        </Link>
      </div>
    </div>
  );
}
