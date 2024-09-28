"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/tremor/Table";
import { ByteFormat } from "@/lib/formatter";

const dummy_files = [
    {
        name: "index.js",
        size: 643,
        type: 1, // 1 = file, 0 = directory
        createdAt: new Date(),
    }
]

export default function FileManagerPage({
}) {
    const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

    return (
        <main className="flex flex-wrap w-full">
            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center px-4 py-2 w-full">
                    <h1 className="text-xl font-bold">File Explorer</h1>
                    <TabsList className="ml-auto">
                    </TabsList>
                </div>

                <Separator />

                <div className="">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell></TableHeaderCell>
                                <TableHeaderCell>Name</TableHeaderCell>
                                <TableHeaderCell>Type</TableHeaderCell>
                                <TableHeaderCell>Size</TableHeaderCell>
                                <TableHeaderCell>Created At</TableHeaderCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {
                                dummy_files.map((file, index) => {
                                    return <TableRow key={index} className={`cursor-pointer ${selectedRows.includes(file.name) ? '' : ''}`} onClick={(e) => {
                                        !selectedRows.includes(file.name) ? setSelectedRows([...selectedRows, file.name]) : {}
                                    }}>
                                        <TableCell>
                                        </TableCell>
                                        <TableCell>{file.name}</TableCell>
                                        <TableCell>{file.type == 1 ? "File" : "Directory"}</TableCell>
                                        <TableCell>{ByteFormat("byte").format(file.size)}</TableCell>
                                        <TableCell>{file.createdAt.toISOString()}</TableCell>
                                    </TableRow>
                                })
                            }
                        </TableBody>
                    </Table>
                </div>
            </Tabs>
        </main>
    );
}
