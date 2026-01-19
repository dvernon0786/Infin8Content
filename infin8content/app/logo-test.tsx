"use client";

import Logo from '@/components/shared/Logo';

export default function TestPage() {
  return (
    <div style={{ padding: '50px' }}>
      <h1>Logo Test Page</h1>
      <p>This should show a red-green gradient box with yellow border:</p>
      <Logo width={192} height={41} />
      <p>If you see the logo above, it's working!</p>
    </div>
  );
}
