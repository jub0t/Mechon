"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Cog, Copy, CopyIcon, FolderClosed, Package, PackageX, TerminalIcon, Trash2, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import MemoryUsage from "./MemoryUsage";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const LogTypes = ["out", "success", "error"];
export type LogType = "out" | "success" | "error";
export interface LogItem {
    content: string,
    type: LogType,
}

const LogTypeToColor = function (log: LogType): string {
    const matches = {
        "out": "",
        "error": "text-red-500",
        "warn": "text-orange-500",
        "success": "text-green-500",
    };

    return matches[log]
}

export default function SingleBotPage({ }: {
}) {
    const params = useParams();
    const bot_id = params['bot_id'];

    return (
        <main className="w-full flex flex-wrap w-full p-16">
            <div>
                <h1 className="text-3xl font-bold">
                    Project Name
                </h1>
                <div className="gap-1 flex mt-1">
                    <Badge variant={"outline"} className="rounded-md">Node Runtime</Badge>
                    <Badge variant={"outline"} className="rounded-md">Javascript</Badge>
                </div>
            </div>

            <div className="mt-12 w-full gap-4 flex flex-wrap">
                <section className="flex items-center gap-2 w-full">
                    <div className="flex justify-between w-full">
                        <div className="flex items-center gap-2">
                            <Card className="w-full">
                                <div className="w-full flex gap-3 items-center py-2 px-5">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <h5 className="">Running</h5>
                                </div>
                            </Card>

                            <Button variant={"default"} className="bg-primary">Start</Button>
                        </div>

                        <div className="flex gap-2 items-center">
                            <Button variant={"outline"} className="items-center flex gap-2">
                                <span>
                                    <Package className="w-4 h-4" />
                                </span>
                                <span>
                                    Install Dependencies
                                </span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button variant={"outline"} className="items-center flex gap-2">
                                        <span>
                                            <Cog className="w-4 h-4" />
                                        </span>
                                        {/* <span>
                                            Actions
                                        </span> */}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem className="gap-2">
                                        <span>
                                            <PackageX className="w-4 h-4"></PackageX>
                                        </span>
                                        <span>
                                            Remove Dependencies
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="gap-2">
                                        <span>
                                            <Variable className="w-4 h-4" />
                                        </span>
                                        <span>
                                            Environment Variables
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2">
                                        <span>
                                            <CopyIcon className="w-4 h-4" />
                                        </span>
                                        <span>
                                            Copy ID
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="gap-2">
                                        <span>
                                            <Trash2 className="w-4 h-4"></Trash2>
                                        </span>
                                        <span>
                                            Delete Project
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                </section>

                <section className="grid grid-cols-6 gap-4 w-full">
                    <section className="col-span-3 grid grid-cols-1 gap-4">
                        <Card className="">
                            <CardHeader>
                                <CardTitle className=" flex items-center space-x-2 text-sm">
                                    <span>
                                        <FolderClosed className="w-4 h-4" />
                                    </span>
                                    <span>
                                        Manage Files
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Direct access to explore edit the files and folders related to this project.
                                </CardDescription>
                            </CardHeader>

                            <CardContent />

                            <CardFooter className="flex justify-between">
                                <div className="grid">
                                    <h2 className="uppercase font-bold">
                                        345.54 MB
                                    </h2>
                                    <h4>
                                        <CardDescription>
                                            Storage Used
                                        </CardDescription>
                                    </h4>
                                </div>
                                <Button variant={"secondary"}>Manage</Button>
                            </CardFooter>
                        </Card>

                        <Card className="">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-sm">
                                    <span>
                                        <TerminalIcon className="w-4 h-4" />
                                    </span>
                                    <span>
                                        Terminal
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Open this bot in the web-based shell/terminal.
                                </CardDescription>
                            </CardHeader>

                            <CardContent />

                            <CardFooter className="flex justify-between">
                                <div className="grid">
                                    <h2 className="font-bold">
                                        {`/home/user/project`}
                                    </h2>
                                    <h4>
                                        <CardDescription>
                                            Working Directory
                                        </CardDescription>
                                    </h4>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger>

                                        <Button variant={"secondary"} onClick={() => {

                                        }}>Take me</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Critical Feature Ahead!</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Only use the terminal if know what you are doing. Any loss of files or damage inflicted upon the panel will be your responsibility.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </CardFooter>
                        </Card>
                    </section>

                    <section className="col-span-3 h-full">
                        <Card className="w-full h-full flex flex-wrap">
                            <div
                                className="flex resize-none h-full w-full p-3 overflow-y-scroll"
                            >
                                <div className="text-sm">
                                    {

                                        (
                                            [
                                                {

                                                    type: "out",
                                                    content: "Client Has Connected as Example#0000",
                                                },
                                                {

                                                    type: "success",
                                                    content: "Established Connection to Database.",
                                                },
                                                {

                                                    type: "error",
                                                    content: "Unable to Connect to Weather API.",
                                                },
                                                {
                                                    type: "warn",
                                                    content: `Config.js file not found, the application might not function properly.`
                                                }
                                            ] as LogItem[])
                                            .map((v: LogItem, i: any) => {
                                                return <p key={`log_idx_${i}`} className={cn(
                                                    `underline`,
                                                    LogTypeToColor(v.type)
                                                )}>
                                                    <span className={cn(
                                                        "",
                                                    )}>
                                                        {`[${new Date(new Date().getTime() + (3666 * i)).toLocaleTimeString()}]: `}
                                                    </span>
                                                    <span>
                                                        {v.content}
                                                    </span>
                                                </p>
                                            })
                                    }
                                </div>
                            </div>

                        </Card>
                    </section>
                </section>

                <div className="grid 2xl:grid-cols-2 gap-6 w-full">
                    <section className="w-full">
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>346.00 <span>MB</span></CardTitle>
                                <CardDescription>Memory (RAM) Usage</CardDescription>
                            </CardHeader>
                            <CardContent className="w-full">
                                <MemoryUsage></MemoryUsage>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="w-full">
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>55%<span></span></CardTitle>
                                <CardDescription>CPU Consumption</CardDescription>
                            </CardHeader>
                            <CardContent className="w-full">
                                <MemoryUsage></MemoryUsage>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>

            <section>
                <section></section>
                <section></section>
            </section>
        </main>
    );
}
