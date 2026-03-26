import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="eth-pattern flex min-h-screen items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at center, #FFFDF7 0%, #F5F0E6 100%)' }}>
      <Card className="w-full max-w-sm text-center card-gold shadow-lg">
        <CardContent className="pt-8 pb-6 space-y-4">
          <p className="text-[#D4A843] text-lg tracking-widest">✞</p>
          <div className="mx-auto w-16 h-[2px] bg-[#D4A843]" />
          <h1 className="text-3xl font-bold tracking-tight text-primary" style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}>
            ፈለገ ዮርዳኖስ
          </h1>
          <h2 className="text-xl text-primary/80" style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}>
            ሰንበት ት/ቤት
          </h2>
          <p className="text-sm text-muted-foreground">
            Felege Yordanos Sunday School
          </p>
          <Button asChild className="w-full mt-4 bg-[#D4A843] text-[#1A2744] hover:bg-[#B8902F] font-semibold" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
