"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProxyPage({
}) {
    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Manage Proxies</h1>
                    <TabsList className="ml-auto">
                        <Link href="/proxy/new">
                            <Button variant={"default"}>New Proxy</Button>
                        </Link>
                    </TabsList>
                </div>

                <Separator />

            </Tabs>
        </main>
    );
}
