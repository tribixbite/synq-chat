import type * as React from "react";
import { Html } from "@elysiajs/html";

import { cn } from "@/lib/utils";

export const Card = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div
			data-slot="card"
			className={cn("bg-card text-card-foreground rounded-xl border shadow-sm", className)}
			{...props}
		/>
	);
};

export const CardHeader = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div
			data-slot="card-header"
			className={cn("flex flex-col gap-1.5 p-6", className)}
			{...props}
		/>
	);
};

export const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div
			data-slot="card-title"
			className={cn("leading-none font-semibold tracking-tight", className)}
			{...props}
		/>
	);
};

export const CardDescription = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div
			data-slot="card-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
};

export const CardContent = ({ className, ...props }: React.ComponentProps<"div">) => {
	return <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props} />;
};

export const CardFooter = ({ className, ...props }: React.ComponentProps<"div">) => {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center p-6 pt-0", className)}
			{...props}
		/>
	);
};
