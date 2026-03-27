import { CalendarCheck, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';

const adminLinks = [
  {
    href: '/admin/attendance',
    icon: CalendarCheck,
    title: 'Events & Attendance',
    subtitle: 'የስብሰባ እና የስብስብ ክትትል',
    description: 'Coordinate liturgical gatherings, manage choir rehearsals, and track member participation.',
    cta: 'Manage Schedules',
  },
  {
    href: '/admin/donations',
    icon: DollarSign,
    title: 'Donations',
    subtitle: 'ስጦታዎች',
    description: 'Oversee tithes, special contributions, and charitable funds supporting the sanctuary.',
    cta: 'Financial Report',
  },
  {
    href: '/admin/users',
    icon: Users,
    title: 'Manage Users',
    subtitle: 'የተጠቃሚ አስተዳደር',
    description: 'Assign roles, manage departments, and oversee Sunday School membership.',
    cta: 'View Members',
  },
];

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <span className="text-secondary font-label text-[10px] tracking-widest uppercase block mb-1">የአስተዳዳሪ ክፍል</span>
      <h1 className="font-headline text-4xl text-primary leading-tight mb-2">
        Admin Panel
      </h1>
      <div className="h-[2px] w-12 bg-secondary/40 mb-8" />

      <div className="flex flex-col gap-6">
        {adminLinks.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <div className={`rounded-xl p-6 relative overflow-hidden ${
                i === 1 ? 'bg-primary-container text-primary-foreground' : 'bg-surface-container-low tibeb-accent'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${i === 1 ? 'bg-[#fef9ea]/10' : 'bg-secondary/10'}`}>
                    <Icon className={`h-5 w-5 ${i === 1 ? 'text-secondary-container' : 'text-secondary'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-label uppercase tracking-wider mb-1 ${i === 1 ? 'text-[#fef9ea]/50' : 'text-muted-foreground'}`}>
                      {link.subtitle}
                    </p>
                    <h3 className="font-headline text-2xl mb-1">{link.title}</h3>
                    <p className={`text-sm ${i === 1 ? 'text-[#fef9ea]/70' : 'text-muted-foreground'}`}>
                      {link.description}
                    </p>
                    <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${
                      i === 1 ? 'text-secondary-container' : 'text-primary'
                    }`}>
                      {link.cta} →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
