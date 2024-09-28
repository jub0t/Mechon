"use client";

import * as React from "react";
import {
    Bot,
    ChartPie,
    Users,
    Trash,
    Logs,
    Folders,
    Terminal,
    Frown,
    OctagonX,
    Network,
    Sun,
} from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { Nav } from "./Navigation";
import { cn } from "@/lib/utils";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LayoutLessRoutes = ["/login"]

export default function Backbone({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const pathname = usePathname();

    return (
        <main className="w-full flex flex-wrap">
            {
                LayoutLessRoutes.includes(pathname)
                    ?
                    children
                    :
                    <TooltipProvider delayDuration={0}>
                        <ResizablePanelGroup
                            direction="horizontal"
                            onLayout={(sizes: number[]) => {
                                document.cookie = `react-resizable-panels:layout=${JSON.stringify(
                                    sizes,
                                )}`;
                            }}
                            className="h-full w-full items-stretch"
                        >
                            <ResizablePanel
                                defaultSize={15}
                                collapsedSize={0}
                                collapsible={true}
                                className={cn(
                                    isCollapsed &&
                                    "min-w-[50px] transition-all duration-300 ease-in-out",
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex h-[56px] items-center justify-center",
                                        isCollapsed ? "h-[52x]" : "px-2",
                                    )}
                                >
                                    <div>
                                    </div>

                                    <div className="w-full flex flex-wrap">
                                        {/* <Card className="w-full">
                                            {
                                                isOnline ?
                                                    <div>
                                                        <div className="w-full flex gap-3 items-center py-2 px-5">
                                                            <span className="relative flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                            </span>
                                                            <h5 className="">Online</h5>
                                                        </div>
                                                    </div> :
                                                    <div className="w-full flex gap-2 items-center py-2 px-5">
                                                        <OctagonX className="text-primary w-4 h-4" />
                                                        <h5 className="">Offline</h5>
                                                    </div>
                                            }
                                        </Card> */}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="w-full">
                                                <Button variant={"outline"} className="flex gap-2 items-center w-full">
                                                    <span>
                                                        <Sun className="w-4 g-4" />
                                                    </span>
                                                    <span>
                                                        Select Theme
                                                    </span>
                                                </Button>

                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                className="w-full">
                                                {
                                                    [
                                                        "Light",
                                                        "Dark",
                                                        "System"
                                                    ].map((v, i) => {
                                                        return <DropdownMenuItem
                                                            key={i}
                                                            className="w-full"
                                                        >
                                                            <Button
                                                                className="w-full"
                                                                variant={"outline"}
                                                                onClick={async () => {
                                                                    fetch('/api/switch-theme', {
                                                                        method: "POST",
                                                                        headers: {
                                                                            "content-type": "application/json",
                                                                        },
                                                                        body: JSON.stringify({
                                                                            theme: v,
                                                                        })
                                                                    })
                                                                        .then((res: any) => res.json())
                                                                        .then((data: any) => {
                                                                            window.location.reload()
                                                                        })
                                                                }}>
                                                                <span>
                                                                    {v}
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuItem>
                                                    })
                                                }
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <Separator />
                                <Nav
                                    isCollapsed={isCollapsed}
                                    links={[
                                        {
                                            title: "Dashboard",
                                            // label: "128",
                                            path: "/",
                                            icon: ChartPie,
                                            variant: "default",
                                        },
                                        {
                                            title: "Bots",
                                            path: "/bots",
                                            // label: "9",
                                            icon: Bot,
                                            variant: "ghost",
                                        },
                                        {
                                            title: "Users",
                                            path: "/users",
                                            label: "",
                                            icon: Users,
                                            variant: "ghost",
                                        },
                                    ]}
                                />

                                <Separator />
                                <Nav
                                    isCollapsed={isCollapsed}
                                    links={[
                                        {
                                            path: "/proxy",
                                            title: "Reverse Proxy",
                                            icon: Network,
                                            variant: "ghost",
                                        },
                                    ]}
                                />

                                <Separator />

                                <Nav
                                    isCollapsed={isCollapsed}
                                    links={[
                                        {
                                            path: "/terminal",
                                            title: "Terminal",
                                            icon: Terminal,
                                            variant: "ghost",
                                        },
                                        {
                                            path: "/file-explorer",
                                            title: "File Explorer",
                                            icon: Folders,
                                            variant: "ghost",
                                        },
                                        {
                                            path: "/trash-recovery",
                                            title: "Trash Recovery",
                                            icon: Trash,
                                            variant: "ghost",
                                        },
                                        {
                                            path: "/logs-and-reports",
                                            title: "Logs & Reports",
                                            icon: Logs,
                                            variant: "ghost",
                                        },
                                    ]}
                                />
                                <Separator />

                                <div className="p-2">
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            <ResizablePanel defaultSize={80}>
                                <section className="w-full flex flex-wrap">
                                    {children}
                                </section>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </TooltipProvider>
            }
        </main>
    );
}
