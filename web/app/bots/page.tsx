"use client";

import * as React from "react";
import {
    Search,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mails, type Mail } from "@/app/examples/mail/data";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BotItemsList from "@/app/bots/components/BotItem";
import Link from "next/link";


export default function ManageBots({ }) {
    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Bot Manager</h1>
                    <TabsList className="ml-auto">
                        <Link href="/bots/create">
                            <Button variant={"default"}>Create New Bot</Button>
                        </Link>
                    </TabsList>
                </div>

                <Separator />

                <div className="w-full bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <form>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search" className="pl-8" />
                        </div>
                    </form>
                </div>
                <TabsContent value="all" className="m-0">
                    <BotItemsList items={mails} />
                </TabsContent>
                <TabsContent value="unread" className="m-0">
                    <BotItemsList items={mails.filter((item) => !item.isRunning)} />
                </TabsContent>
            </Tabs>
        </main>
    );
}
