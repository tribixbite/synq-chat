import classNames from "classnames";
import { useEffect, type KeyboardEvent, useCallback } from "react";
import { PiGearSixFill } from "react-icons/pi";
import { PROVIDERS } from "./../../../utils/providers";

interface LocalSettings {
	apiKey?: string;
	apiUrl?: string;
	model?: string;
	openRouterApiKey?: string;
	openRouterApiUrl?: string;
	openRouterModel?: string;
}

function Settings({
	open,
	onClose,
	provider,
	error,
	onChange,
	localSettings,
	setLocalSettings
}: {
	open: boolean;
	provider: string;
	error?: string;
	onClose: React.Dispatch<React.SetStateAction<boolean>>;
	onChange: (provider: string) => void;
	localSettings: LocalSettings;
	setLocalSettings: React.Dispatch<React.SetStateAction<LocalSettings>>;
}) {
	// persist the local settings to local storage
	const persistLocalSettings = useCallback(() => {
		localStorage.setItem("localSettings", JSON.stringify(localSettings));
	}, [localSettings]);

	useEffect(() => {
		persistLocalSettings();
	}, [persistLocalSettings]);

	return (
		<div className="">
			<button
				type="button"
				className="relative overflow-hidden cursor-pointer flex-none flex items-center justify-center rounded-full text-base font-semibold size-8 text-center bg-gray-800 hover:bg-gray-700 text-gray-100 shadow-sm dark:shadow-highlight/20"
				onClick={() => {
					onClose(prev => !prev);
				}}
			>
				<PiGearSixFill />
			</button>
			<div
				className={classNames("h-screen w-screen bg-black/20 fixed left-0 top-0 z-40", {
					"opacity-0 pointer-events-none": !open
				})}
				onClick={() => onClose(false)}
				role="button"
				tabIndex={0}
				onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
					if (e.key === "Enter" || e.key === " ") {
						onClose(false);
					}
				}}
			/>
			<div
				className={classNames(
					"absolute top-0 -translate-y-[calc(100%+16px)] right-0 z-40 w-96 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden",
					{
						"opacity-0 pointer-events-none": !open
					}
				)}
			>
				<header className="flex items-center text-sm px-4 py-2 border-b border-gray-200 gap-2 bg-gray-100 font-semibold text-gray-700">
					<span className="text-xs bg-blue-500/10 text-blue-500 rounded-full pl-1.5 pr-2.5 py-0.5 flex items-center justify-start gap-1.5">
						Provider
					</span>
					Customize Settings
				</header>
				<main className="px-4 pt-3 pb-4 space-y-4">
					{/* toggle using tailwind css */}
					<div>
						<div className="flex items-center justify-between">
							<p className="text-gray-800 text-sm font-medium flex items-center justify-between">
								Use auto-provider
							</p>
							<div
								className={classNames(
									"bg-gray-200 rounded-full w-10 h-6 flex items-center justify-between p-1 cursor-pointer transition-all duration-200",
									{
										"!bg-blue-500": provider === "auto"
									}
								)}
								onClick={() => {
									onChange(provider === "auto" ? "fireworks-ai" : "auto");
								}}
								role="switch"
								aria-checked={provider === "auto"}
								tabIndex={0}
								onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
									if (e.key === "Enter" || e.key === " ") {
										onChange(provider === "auto" ? "fireworks-ai" : "auto");
									}
								}}
							>
								<div
									className={classNames(
										"w-4 h-4 rounded-full shadow-md transition-all duration-200 bg-white",
										{
											"translate-x-4": provider === "auto"
										}
									)}
								/>
							</div>
						</div>
						<p className="text-xs text-gray-500 mt-2">
							We'll automatically select the best provider for you based on your
							prompt.
						</p>
					</div>
					{error !== "" && (
						<p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
							{error}
						</p>
					)}
					<div className="block">
						<p className="text-gray-800 text-sm font-medium mb-2 flex items-center justify-between">
							Inference Provider
						</p>
						<div className="grid grid-cols-2 gap-1.5">
							{Object.keys(PROVIDERS).map((id: string) => (
								<button
									type="button"
									key={id}
									className={classNames(
										"text-gray-600 text-sm font-medium cursor-pointer border p-2 rounded-md flex items-center justify-start gap-2 text-left",
										{
											"bg-blue-500/10 border-blue-500/15 text-blue-500":
												id === provider,
											"hover:bg-gray-100 border-gray-100": id !== provider
										}
									)}
									onClick={() => {
										onChange(id);
									}}
								>
									<img
										src={`/providers/${id}.svg`}
										alt={PROVIDERS[id].name}
										className="size-5"
									/>
									{PROVIDERS[id].name}
								</button>
							))}
						</div>
						<hr className="text-gray-800 text-sm font-medium mb-2" />
					</div>
					{provider === "local" && (
						<div className="space-y-2">
							<p className="text-gray-800 text-sm font-medium mb-2">
								Make sure to run the local server first
							</p>
							<hr className="text-gray-800 text-sm font-medium mb-2" />
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">API Key</p>
								<input
									type="text"
									value={localSettings.apiKey}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											apiKey: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">API URL</p>
								<input
									type="text"
									value={localSettings.apiUrl || "http://localhost:11434/v1"}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											apiUrl: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">Model</p>
								<input
									type="text"
									value={localSettings.model || "gemma3:1b"}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											model: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
						</div>
					)}
					{provider === "openrouter" && (
						<div className="space-y-2">
							<p className="text-gray-800 text-sm font-medium mb-2">
								Get your OpenRouter API key from
								<a
									href="https://openrouter.ai/
                  "
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-500"
								>
									here
								</a>
							</p>
							<hr className="text-gray-800 text-sm font-medium mb-2" />
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">API Key</p>
								<input
									type="text"
									value={localSettings.openRouterApiKey}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											openRouterApiKey: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">Base URL</p>
								<input
									type="text"
									value={
										localSettings.openRouterApiUrl ||
										"https://openrouter.ai/api/v1"
									}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											openRouterApiUrl: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
							<label className="block">
								<p className="text-gray-800 text-sm font-medium mb-1">Model</p>
								<input
									type="text"
									value={
										localSettings.openRouterModel ||
										"deepseek/deepseek-chat-v3-0324:free"
									}
									onChange={e => {
										setLocalSettings({
											...localSettings,
											openRouterModel: e.target.value
										});
									}}
									className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</label>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
export default Settings;
