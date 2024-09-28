"use client";

import * as React from "react";
import {
    Search,
    Shield,
    UserCog,
} from "lucide-react";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { mails, type Mail } from "@/app/examples/mail/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import BotItemsList from "@/app/bots/components/BotItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function UsersPage({
}) {
    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Manage Users</h1>
                    <TabsList className="ml-auto">
                        <Link href="/bots/create">
                            <Button variant={"default"}>Create New User</Button>
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
                <ScrollArea className="h-screen w-full">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 w-full flex flex-col gap-2 p-4 pt-0">
                        {([
                            {
                                username: "admin",
                                is_admin: true,
                            },
                            {
                                username: "johndoe",
                                is_admin: false,
                            },
                            {
                                username: "sleepyjoe",
                                is_admin: false,
                            },
                        ] as any).map((item: any, v: any) => (
                            <Link
                                key={v}
                                href={`/users/${item?.username}`}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-lg border text-left text-sm transition-all hover:bg-accent"
                                )}
                            >
                                <div className="flex w-full p-4">
                                    <div className="flex items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-2">
                                                {
                                                    item.is_admin ?
                                                        <Shield className="w-4 h-4"></Shield>
                                                        :
                                                        <UserCog className="w-4 h-4"></UserCog>
                                                }
                                            </span>
                                            <div className="font-semibold">{item.username}</div>
                                        </div>
                                    </div>
                                </div>

                                <Separator></Separator>

                                <div className="sm:flex sm:justify-between sm:space-y-0 space-y-2 py-4 px-6 w-full">
                                    <div className="w-full">
                                        <h2 className="font-bold text-lg">0/10</h2>
                                        <h4>Max Bots</h4>
                                    </div>

                                    <div className="sm:float-right w-full">
                                        <div className="sm:float-right">
                                            <h2 className="font-bold text-lg">2048 MB</h2>
                                            <h4>Memory</h4>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </Tabs>
        </main>
    );
}
