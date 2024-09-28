"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MemoryUsage from "@/app/bots/[bot_id]/MemoryUsage";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation";
import { Bot, Cog, MemoryStick } from "lucide-react";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SingleBotPage({ }: {
}) {
    const params = useParams();
    const username = params['username'];

    return (
        <main className="w-full flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">Manage User</h1>
                    <div className="ml-auto bg-transparent">
                        <Button variant={"outline"} className="items-center flex gap-2">
                            <span>
                                <Cog className="w-4 h-4" />
                            </span>
                            <span>
                                Actions
                            </span>
                        </Button>
                    </div>
                </div>

                <Separator />
            </Tabs>

            <section className="p-12 w-full grid grid-cols-3 gap-4">
                <section>
                    <Card>
                        <CardHeader>
                            <div className="items-center flex gap-3">
                                {/* <Avatar>
                                    <AvatarImage className="rounded-sm" src="https://dummyimage.com/512x512/000000"></AvatarImage>
                                </Avatar> */}

                                <div>
                                    <h3 className="font-bold tracking-wide">
                                        {username}
                                    </h3>
                                    <Badge variant={"outline"}>ADMIN</Badge>
                                    {/* <h5 className="font-bold">
                                            ADMIN
                                        </h5> */}
                                </div>
                            </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="mt-4 gap-4 grid w-full">

                            <section className="">
                                <div className="text-sm w-full flex justify-between">
                                    <h2 className="flex items-center gap-1">
                                        {/* <span>
                                            <Bot className="w-4 h-4" />
                                        </span> */}
                                        <span>
                                            Max Bots
                                        </span>
                                    </h2>
                                    <h2>
                                        23/100
                                    </h2>
                                </div>
                                <Progress value={23} className="h-3"></Progress>
                            </section>

                            <section>
                                <div className="text-sm w-full flex justify-between">
                                    <h2 className="flex items-center gap-1">
                                        {/* <span>
                                            <MemoryStick className="w-4 h-4" />
                                        </span> */}
                                        <span>
                                            Memory Limit
                                        </span>
                                    </h2>
                                    <h2>
                                        564/{4 * 1024}
                                    </h2>
                                </div>
                                <Progress value={(564 / (4 * 1024)) * 100} className="h-3"></Progress>
                            </section>

                        </CardContent>
                    </Card>
                </section>

                <section className="col-span-2">
                    <Card className="p-5">
                        <MemoryUsage></MemoryUsage>
                    </Card>
                </section>
            </section>
        </main>
    );
}
