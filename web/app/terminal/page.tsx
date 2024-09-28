"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import * as React from "react";

export default function TerminalPage({
}) {
    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Terminal Access</h1>
                    <TabsList className="ml-auto">
                    </TabsList>
                </div>

                <Separator />

            </Tabs>
        </main>
    );
}
