import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            ፈለገ ዮርዳኖስ
          </h1>
          <h2 className="text-xl text-muted-foreground">
            ሰንበት ት/ቤት
          </h2>
          <p className="text-sm text-muted-foreground">
            Felege Yordanos Sunday School
          </p>
          <Button asChild className="w-full mt-4" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
