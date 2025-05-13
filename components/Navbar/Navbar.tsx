
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, Bell } from "lucide-react";
import { Button } from "../ui/button";

export function Navbar() {
    return (
        <div className="flex items-center px-2 gap-x-4 md:px-6 justify-between w-full bg-background h-20 border-b">
            <div className="block md:hidden">
                <Sheet>
                    <SheetTrigger className="flex items-center">
                        <Menu />
                    </SheetTrigger>
                    <SheetContent side="left">
                        <p>sidebar Routes</p>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="relative w-[300px]">
                <Input type="text" placeholder="Search..." className="rounded-lg" />
                <Search strokeWidth={1} className="absolute top-2 right-2" /> 
            </div>
            <div className="flex items-center gap-x-4">
                <Bell />
            </div>
        </div>
    )
}
