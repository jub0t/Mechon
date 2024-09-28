"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui//button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, LoaderCircle } from "lucide-react"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Authentication({ className, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)

        setTimeout(() => {
            setIsLoading(false)
        }, 3000)
    }

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                    <div className="grid gap-1">
                        <Label className="" htmlFor="email">
                            Username or Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="verusnovem"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label className="" htmlFor="email">
                            Password
                        </Label>
                        <Input
                            id="email"
                            placeholder="******"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                        />
                    </div>

                    <Button disabled={isLoading}>
                        {isLoading && (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Take me to Dashboard.
                    </Button>
                </div>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button variant="outline" type="button" disabled={isLoading}>
                {isLoading ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Github className="mr-2 h-4 w-4" />
                )}{" "}
                GitHub
            </Button>
        </div>
    )
}