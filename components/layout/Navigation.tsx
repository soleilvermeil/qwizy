"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavigationProps {
  items: NavItem[];
}

export function Navigation({ items }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:block bg-secondary/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 h-14">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg
                  transition-colors text-sm font-medium
                  ${isActive 
                    ? "bg-primary text-white" 
                    : "text-foreground hover:bg-accent"
                  }
                `}
              >
                <span className="w-4 h-4">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
