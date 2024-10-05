"use client";

import { Tabs, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/tremor/Table";
import { ByteFormat } from "@/lib/formatter";
import directories from "@/data/directories";
import { DirectoryType } from "@/lib/utils";

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
                                directories.map((dir, index) => {
                                    return <TableRow key={index} className={`cursor-pointer ${selectedRows.includes(dir.name) ? '' : ''}`} onClick={(e) => {
                                        !selectedRows.includes(dir.name) ? setSelectedRows([...selectedRows, dir.name]) : {}
                                    }}>
                                        <TableCell>
                                        </TableCell>
                                        <TableCell>{dir.name}</TableCell>
                                        <TableCell>{dir.type == DirectoryType.File ? "File" : "Directory"}</TableCell>
                                        <TableCell>
                                            {
                                                dir?.size != null ? ByteFormat("byte").format(dir.size) : null
                                            }
                                        </TableCell>
                                        <TableCell>{dir.createdAt.toISOString()}</TableCell>
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
