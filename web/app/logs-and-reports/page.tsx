"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import * as React from "react";

export default function LogsAndReportsPage({
}) {
    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Logs & Reports</h1>
                    <TabsList className="ml-auto">
                        {/* <Button variant={"default"}>Create New User</Button> */}
                    </TabsList>
                </div>

                <Separator />

            </Tabs>
        </main>
    );
}
