import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Html } from "@elysiajs/html";
import {
	Folder,
	LayoutDashboard,
	Smartphone,
	Monitor,
	Code,
	FileText,
	FolderOpen,
	ExternalLink,
	Zap
} from "lucide-react";
import "./index.css";

interface AppGalleryProps {
	htmlAppsList: string[];
	folderAppsList: string[];
	tsxAppsList: string[];
	totalCount: number;
	currentTime: string;
}

export const AppGallery = ({
	htmlAppsList,
	folderAppsList,
	tsxAppsList,
	totalCount,
	currentTime
}: AppGalleryProps) => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
			{/* Navigation */}
			<nav className="glass sticky top-0 z-50 border-b">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-4">
							<div className="text-2xl font-bold">🦊</div>
							<h1 className="text-xl font-semibold">Synq Chat</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm opacity-75">{currentTime}</span>
							<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="text-center">
					<h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
						<span className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
							App Gallery
						</span>
					</h1>
					<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
						Discover and explore our collection of dynamic applications and interactive
						experiences. Built with modern web technologies and optimized for
						performance.
					</p>

					<div className="flex flex-wrap justify-center gap-4 mb-8">
						<Card className="glass border-muted">
							<CardContent className="pt-6">
								<div className="text-2xl font-bold">{folderAppsList.length}</div>
								<div className="text-sm text-muted-foreground">Full Apps</div>
							</CardContent>
						</Card>
						<Card className="glass border-muted">
							<CardContent className="pt-6">
								<div className="text-2xl font-bold">{tsxAppsList.length}</div>
								<div className="text-sm text-muted-foreground">TSX Apps</div>
							</CardContent>
						</Card>
						<Card className="glass border-muted">
							<CardContent className="pt-6">
								<div className="text-2xl font-bold">{htmlAppsList.length}</div>
								<div className="text-sm text-muted-foreground">HTML Pages</div>
							</CardContent>
						</Card>
						<Card className="glass border-muted">
							<CardContent className="pt-6">
								<div className="text-2xl font-bold">Bun</div>
								<div className="text-sm text-muted-foreground">Powered</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
				{/* TSX Apps */}
				{tsxAppsList.length > 0 && (
					<div className="mb-16">
						<h2 className="text-3xl font-bold mb-8 flex items-center">
							<Zap className="mr-3 text-yellow-400" />
							TSX Applications
							<span className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full">
								COMPILED
							</span>
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{tsxAppsList.map((appName, index) => (
								<Card
									key={appName}
									className="glass border-muted hover:border-yellow-400/50 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
									style={{ animationDelay: `${index * 0.1}s` }}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
												<Zap className="w-6 h-6 text-yellow-400" />
											</div>
											<div className="flex items-center space-x-2">
												<div className="w-2 h-2 bg-yellow-400 rounded-full" />
												<span className="text-xs text-yellow-400 font-medium">
													TSX
												</span>
											</div>
										</div>
										<CardTitle className="capitalize">
											{appName.replace(/-/g, " ")}
										</CardTitle>
										<CardDescription>
											React TSX application compiled on-the-fly with Bun's
											native transpiler.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<Button
												asChild
												className="group bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
											>
												<a href={`/apps/${appName}`}>
													Launch TSX
													<ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
												</a>
											</Button>
											<div className="flex space-x-2">
												<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
													<Smartphone className="w-4 h-4" />
												</div>
												<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
													<Monitor className="w-4 h-4" />
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* Directory-based Apps */}
				{folderAppsList.length > 0 && (
					<div className="mb-16">
						<h2 className="text-3xl font-bold mb-8 flex items-center">
							<Folder className="mr-3" />
							Interactive Applications
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{folderAppsList.map((appName, index) => (
								<Card
									key={appName}
									className="glass border-muted hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
									style={{
										animationDelay: `${(tsxAppsList.length + index) * 0.1}s`
									}}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
												<LayoutDashboard className="w-6 h-6 text-primary" />
											</div>
											<div className="flex items-center space-x-2">
												<div className="w-2 h-2 bg-green-400 rounded-full" />
												<span className="text-xs text-green-400 font-medium">
													LIVE
												</span>
											</div>
										</div>
										<CardTitle className="capitalize">
											{appName.replace(/-/g, " ")}
										</CardTitle>
										<CardDescription>
											Interactive application with full functionality and
											modern UI components.
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between">
											<Button asChild className="group">
												<a href={`/apps/${appName}`}>
													Launch App
													<ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
												</a>
											</Button>
											<div className="flex space-x-2">
												<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
													<Smartphone className="w-4 h-4" />
												</div>
												<div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
													<Monitor className="w-4 h-4" />
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* HTML-based Experiences */}
				{htmlAppsList.length > 0 && (
					<div className="mb-16">
						<h2 className="text-3xl font-bold mb-8 flex items-center">
							<Code className="mr-3" />
							Standalone Experiences
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							{htmlAppsList.map((appName, index) => (
								<Card
									key={appName}
									className="glass border-muted hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
									style={{
										animationDelay: `${(tsxAppsList.length + folderAppsList.length + index) * 0.1}s`
									}}
								>
									<CardHeader className="pb-3">
										<div className="w-10 h-10 bg-secondary/50 rounded-lg flex items-center justify-center mb-3">
											<FileText className="w-5 h-5 text-secondary-foreground" />
										</div>
										<CardTitle className="text-sm capitalize">
											{appName.replace(/-/g, " ")}
										</CardTitle>
										<CardDescription className="text-xs">
											Standalone HTML experience
										</CardDescription>
									</CardHeader>
									<CardContent className="pt-0">
										<Button
											asChild
											size="sm"
											variant="secondary"
											className="w-full group"
										>
											<a href={`/apps/${appName}`}>
												Open
												<ExternalLink className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
											</a>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}

				{/* Empty State */}
				{totalCount === 0 && (
					<Card className="glass border-muted text-center py-16">
						<CardContent>
							<div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
								<FolderOpen className="w-12 h-12 text-muted-foreground" />
							</div>
							<CardTitle className="mb-2">No Apps Available</CardTitle>
							<CardDescription>
								Check back later for new applications and experiences.
							</CardDescription>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Footer */}
			<footer className="glass border-t mt-16">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between">
						<div className="flex items-center space-x-4 mb-4 md:mb-0">
							<div className="text-2xl">🦊</div>
							<span className="font-medium">Synq Chat App Gallery</span>
						</div>
						<div className="flex items-center space-x-6 text-sm text-muted-foreground">
							<a href="/test" className="hover:text-foreground transition-colors">
								System Status
							</a>
							<a
								href="/rate-limit-status"
								className="hover:text-foreground transition-colors"
							>
								Rate Limits
							</a>
							<span>Powered by Bun + shadcn/ui</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};
