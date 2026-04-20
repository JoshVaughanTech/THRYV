import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div className="text-center">
        <Zap className="h-12 w-12 text-[#00E5CC] mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-[#a0a0b8] mb-8">This page doesn&apos;t exist</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#00E5CC] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#00CCBB]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back Home
        </Link>
      </div>
    </div>
  );
}
