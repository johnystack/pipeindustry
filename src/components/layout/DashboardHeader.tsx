import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SheetTrigger } from "@/components/ui/sheet";

export const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
      </div>
      {/* You can add other header elements here, like a user menu */}
    </header>
  );
};
