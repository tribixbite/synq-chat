import classNames from "classnames";
import { useEffect, type KeyboardEvent, useCallback } from "react";
import { PiGearSixFill } from "react-icons/pi";
import { PROVIDERS, getAllProviders, getProvider } from "../../utils/providers";

interface LocalSettings {
	// Generic settings
	apiKey?: string;
	apiUrl?: string;
	model?: string;

	// Provider-specific settings
	openRouterApiKey?: string;
	openRouterApiUrl?: string;
	openRouterModel?: string;

	anthropicApiKey?: string;
	anthropicModel?: string;

	openaiApiKey?: string;
	openaiModel?: string;

	googleApiKey?: string;
	googleModel?: string;

	xaiApiKey?: string;
	xaiModel?: string;

	chutesApiKey?: string;
	chutesModel?: string;

	groqApiKey?: string;
	groqModel?: string;

	togetherApiKey?: string;
	togetherModel?: string;
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
	onClose: (value: boolean | ((prev: boolean) => boolean)) => void;
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

	const currentProvider = getProvider(provider);
	const allProviders = getAllProviders();

	const renderProviderSettings = () => {
		if (!currentProvider || provider === "auto") return null;

		const getApiKey = () => {
			switch (provider) {
				case "openrouter":
					return localSettings.openRouterApiKey;
				case "anthropic":
					return localSettings.anthropicApiKey;
				case "openai":
					return localSettings.openaiApiKey;
				case "google":
					return localSettings.googleApiKey;
				case "xai":
					return localSettings.xaiApiKey;
				case "chutes":
					return localSettings.chutesApiKey;
				case "groq":
					return localSettings.groqApiKey;
				case "together":
					return localSettings.togetherApiKey;
				case "local":
					return localSettings.apiKey;
				default:
					return "";
			}
		};

		const getModel = () => {
			switch (provider) {
				case "openrouter":
					return localSettings.openRouterModel || currentProvider.models[0]?.id;
				case "anthropic":
					return localSettings.anthropicModel || currentProvider.models[0]?.id;
				case "openai":
					return localSettings.openaiModel || currentProvider.models[0]?.id;
				case "google":
					return localSettings.googleModel || currentProvider.models[0]?.id;
				case "xai":
					return localSettings.xaiModel || currentProvider.models[0]?.id;
				case "chutes":
					return localSettings.chutesModel || currentProvider.models[0]?.id;
				case "groq":
					return localSettings.groqModel || currentProvider.models[0]?.id;
				case "together":
					return localSettings.togetherModel || currentProvider.models[0]?.id;
				case "local":
					return localSettings.model || currentProvider.models[0]?.id;
				default:
					return "";
			}
		};

		const getApiUrl = () => {
			switch (provider) {
				case "openrouter":
					return localSettings.openRouterApiUrl || currentProvider.apiUrl;
				case "local":
					return localSettings.apiUrl || currentProvider.apiUrl;
				default:
					return currentProvider.apiUrl;
			}
		};

		const updateApiKey = (value: string) => {
			switch (provider) {
				case "openrouter":
					setLocalSettings(prev => ({ ...prev, openRouterApiKey: value }));
					break;
				case "anthropic":
					setLocalSettings(prev => ({ ...prev, anthropicApiKey: value }));
					break;
				case "openai":
					setLocalSettings(prev => ({ ...prev, openaiApiKey: value }));
					break;
				case "google":
					setLocalSettings(prev => ({ ...prev, googleApiKey: value }));
					break;
				case "xai":
					setLocalSettings(prev => ({ ...prev, xaiApiKey: value }));
					break;
				case "chutes":
					setLocalSettings(prev => ({ ...prev, chutesApiKey: value }));
					break;
				case "groq":
					setLocalSettings(prev => ({ ...prev, groqApiKey: value }));
					break;
				case "together":
					setLocalSettings(prev => ({ ...prev, togetherApiKey: value }));
					break;
				case "local":
					setLocalSettings(prev => ({ ...prev, apiKey: value }));
					break;
			}
		};

		const updateModel = (value: string) => {
			switch (provider) {
				case "openrouter":
					setLocalSettings(prev => ({ ...prev, openRouterModel: value }));
					break;
				case "anthropic":
					setLocalSettings(prev => ({ ...prev, anthropicModel: value }));
					break;
				case "openai":
					setLocalSettings(prev => ({ ...prev, openaiModel: value }));
					break;
				case "google":
					setLocalSettings(prev => ({ ...prev, googleModel: value }));
					break;
				case "xai":
					setLocalSettings(prev => ({ ...prev, xaiModel: value }));
					break;
				case "chutes":
					setLocalSettings(prev => ({ ...prev, chutesModel: value }));
					break;
				case "groq":
					setLocalSettings(prev => ({ ...prev, groqModel: value }));
					break;
				case "together":
					setLocalSettings(prev => ({ ...prev, togetherModel: value }));
					break;
				case "local":
					setLocalSettings(prev => ({ ...prev, model: value }));
					break;
			}
		};

		const updateApiUrl = (value: string) => {
			switch (provider) {
				case "openrouter":
					setLocalSettings(prev => ({ ...prev, openRouterApiUrl: value }));
					break;
				case "local":
					setLocalSettings(prev => ({ ...prev, apiUrl: value }));
					break;
			}
		};

		const getProviderDocUrl = () => {
			switch (provider) {
				case "openrouter":
					return "https://openrouter.ai/keys";
				case "anthropic":
					return "https://console.anthropic.com/";
				case "openai":
					return "https://platform.openai.com/api-keys";
				case "google":
					return "https://aistudio.google.com/app/apikey";
				case "xai":
					return "https://console.x.ai/";
				case "chutes":
					return "https://chutes.ai/app";
				case "groq":
					return "https://console.groq.com/keys";
				case "together":
					return "https://api.together.xyz/settings/api-keys";
				default:
					return "#";
			}
		};

		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<p className="text-gray-800 text-sm font-medium">
						{currentProvider.name} Settings
					</p>
					{currentProvider.requiresApiKey && (
						<a
							href={getProviderDocUrl()}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-blue-500 hover:text-blue-600"
						>
							Get API Key
						</a>
					)}
				</div>

				<p className="text-xs text-gray-500">{currentProvider.description}</p>

				<hr className="border-gray-200" />

				{currentProvider.requiresApiKey && (
					<label className="block">
						<p className="text-gray-800 text-sm font-medium mb-1">
							API Key{" "}
							{currentProvider.requiresApiKey && (
								<span className="text-red-500">*</span>
							)}
						</p>
						<input
							type="password"
							value={getApiKey()}
							onChange={e => updateApiKey(e.target.value)}
							placeholder={
								getApiKey() === ""
									? `Using environment variable or enter your ${currentProvider.name} API key`
									: `Enter your ${currentProvider.name} API key`
							}
							className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>
				)}

				{(provider === "local" || provider === "openrouter") && (
					<label className="block">
						<p className="text-gray-800 text-sm font-medium mb-1">API URL</p>
						<input
							type="text"
							value={getApiUrl()}
							onChange={e => updateApiUrl(e.target.value)}
							className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>
				)}

				<label className="block">
					<p className="text-gray-800 text-sm font-medium mb-1">Model</p>
					<select
						value={getModel()}
						onChange={e => updateModel(e.target.value)}
						className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{currentProvider.models.map(model => (
							<option key={model.id} value={model.id}>
								{model.name}{" "}
								{model.pricing &&
									`($${model.pricing.inputTokens}/$${model.pricing.outputTokens})`}
							</option>
						))}
					</select>
					<p className="text-xs text-gray-500 mt-1">
						Context:{" "}
						{currentProvider.models
							.find(m => m.id === getModel())
							?.contextLength?.toLocaleString() || "N/A"}{" "}
						tokens
					</p>
				</label>

				{currentProvider.pricing && (
					<div className="bg-gray-50 p-2 rounded-md">
						<p className="text-xs text-gray-600">
							<strong>Pricing:</strong> ${currentProvider.pricing.inputTokens}/M
							input, ${currentProvider.pricing.outputTokens}/M output tokens
						</p>
						{currentProvider.rateLimit && (
							<p className="text-xs text-gray-600">
								<strong>Rate Limit:</strong>{" "}
								{currentProvider.rateLimit.requestsPerMinute} req/min,{" "}
								{currentProvider.rateLimit.tokensPerMinute?.toLocaleString()}{" "}
								tokens/min
							</p>
						)}
					</div>
				)}
			</div>
		);
	};

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
					"absolute top-0 -translate-y-[calc(100%+16px)] right-0 z-40 w-96 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-75 overflow-hidden max-h-[80vh] overflow-y-auto",
					{
						"opacity-0 pointer-events-none": !open
					}
				)}
			>
				<header className="flex items-center text-sm px-4 py-2 border-b border-gray-200 gap-2 bg-gray-100 font-semibold text-gray-700 sticky top-0">
					<span className="text-xs bg-blue-500/10 text-blue-500 rounded-full pl-1.5 pr-2.5 py-0.5 flex items-center justify-start gap-1.5">
						Provider
					</span>
					AI Provider Settings
				</header>
				<main className="px-4 pt-3 pb-4 space-y-4">
					{/* Auto-provider toggle */}
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
									onChange(provider === "auto" ? "openrouter" : "auto");
								}}
								role="switch"
								aria-checked={provider === "auto"}
								tabIndex={0}
								onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
									if (e.key === "Enter" || e.key === " ") {
										onChange(provider === "auto" ? "openrouter" : "auto");
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

					{/* Provider selection */}
					<div className="block">
						<p className="text-gray-800 text-sm font-medium mb-2 flex items-center justify-between">
							AI Provider ({allProviders.length} available)
						</p>
						<div className="grid grid-cols-2 gap-1.5">
							{allProviders.map(providerData => (
								<button
									type="button"
									key={providerData.id}
									className={classNames(
										"text-gray-600 text-sm font-medium cursor-pointer border p-2 rounded-md flex items-center justify-start gap-2 text-left relative",
										{
											"bg-blue-500/10 border-blue-500/15 text-blue-500":
												providerData.id === provider,
											"hover:bg-gray-100 border-gray-100":
												providerData.id !== provider
										}
									)}
									onClick={() => {
										onChange(providerData.id);
									}}
								>
									<img
										src={`/apps/vibesynq/providers/${providerData.id ?? "default"}.svg`}
										alt={providerData.name}
										className="size-5"
										onError={e => {
											// Fallback to a generic icon if provider icon doesn't exist
											// (e.target as HTMLImageElement).src =
											// 	"/apps/vibesynq/providers/default.svg";
										}}
									/>
									<div className="flex-1">
										<div className="font-medium">{providerData.name}</div>
										<div className="text-xs text-gray-500 truncate">
											{providerData.models.length} models
										</div>
									</div>
									{!providerData.requiresApiKey && (
										<span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 rounded-full">
											Free
										</span>
									)}
								</button>
							))}
						</div>
					</div>

					{/* Provider-specific settings */}
					{renderProviderSettings()}
				</main>
			</div>
		</div>
	);
}

export default Settings;
