import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { CalendarCheck, DollarSign, Users, Shield } from 'lucide-react';
import Link from 'next/link';

const adminLinks = [
  {
    href: '/admin/attendance',
    icon: CalendarCheck,
    title: 'Events & Attendance',
    description: 'Create events and track attendance',
  },
  {
    href: '/admin/donations',
    icon: DollarSign,
    title: 'Donations',
    description: 'Verify submitted donations',
  },
  {
    href: '/admin/users',
    icon: Users,
    title: 'Manage Users',
    description: 'Assign roles and departments',
  },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your Sunday School
      </p>
      <div className="mt-6 grid gap-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 py-4">
                  <Icon className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
