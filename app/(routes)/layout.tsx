import React from "react"; 
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function LayoutDashboard({
    children,
}: {
    children: React.ReactElement;
}) {
    return (
        <div className="flex w-full h-full">
            <div className="hidden md:block w-64 h-full md:fixed">
                <Sidebar />
            </div>
            <div className="w-full md:ml-64">
                <Navbar />
                <div className="p-6 bg-[#fafbfc] dark:bg-secondary min-h-screen">
                {children}
                </div>
            </div>
        </div>
    )
}