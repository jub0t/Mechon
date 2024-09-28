"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import * as React from "react";

export default function CreateBotPage({ }) {
    return (
        <main className="flex flex-wrap w-full w-full">
            <div className="flex items-center h-[56px] px-4 py-2 w-full">
                <h1 className="text-xl font-bold">Create New Bot</h1>
            </div>

            <Separator />

            <section className="p-8 w-full">
                <Card className="w-full">
                    <CardHeader>
                    </CardHeader>

                    <Separator />

                    <CardContent>
                        <section className="p-6 w-full">
                            <div>
                                <Label>Memory Limit {41}/{4 * 1024}</Label>
                                <Slider defaultValue={[33]}
                                    onChange={(e) => {
                                        console.log(e)
                                    }}
                                    max={4000} step={1} />
                            </div>
                        </section>
                    </CardContent>

                    <Separator />

                    <CardFooter>

                    </CardFooter>
                </Card>
            </section>
        </main>
    );
}
