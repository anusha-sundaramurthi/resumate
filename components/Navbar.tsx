'use client';

import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="flex items-center gap-2">
        <h3 className="text-2xl font-bold text-gradient">ResuMate</h3>
      </Link>
      <div className="flex items-center gap-4">
        {isSignedIn && (
          <>
            <Link href="/upload" className="primary-button text-sm">
              Upload Resume
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </>
        )}
      </div>
    </nav>
  );
}