'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileTopbar from './MobileTopbar'

const PUBLIC_PATHS = ['/', '/giris', '/kurumsal', '/ekibimiz', '/hizmetlerimiz', '/egitimler', '/referanslar', '/yazilarimiz', '/iletisim', '/tehlike-sinifi', '/ramak-kala', '/portal']

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) return <>{children}</>
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        <MobileTopbar />
        {children}
      </main>
    </div>
  )
}
