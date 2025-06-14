import type * as React from "react";

// General data structures
export interface PlayerPosition {
	x: number;
	y: number;
	// z?: number; // If 3D
	// rotationY?: number; // If 3D
	nickname?: string;
	connectionId: string; // Keep track of who this position belongs to
	color?: string;
}

export interface ConnectedUser {
	// This is a more generic user type, presence might be separate
	id: string;
	nickname?: string;
	// presence?: any; // Generic presence, or specific like PlayerPosition
}

export interface ChatMessage {
	id: string;
	connectionId: string; // Changed from sender, to align with usage
	nickname: string; // Added to align with usage
	text: string; // Changed from message, to align with usage
	timestamp: number;
	color?: string; // Added to align with usage
}

// Options for react-together hooks
export interface UseStateTogetherOptions {
	resetOnDisconnect?: boolean;
	throttleDelay?: number;
}

export interface UseStateTogetherWithPerUserValuesOptions {
	resetOnDisconnect?: boolean;
	resetOnConnect?: boolean;
	keepValues?: boolean;
	overwriteSessionValue?: boolean;
	omitMyValue?: boolean;
	throttleDelay?: number;
}

// Signatures for react-together hooks
export type UseMyIdHook = () => string | null;
export type UseConnectedUsersHook = () => ConnectedUser[];
export type UseNicknamesHook = () => [string, (nickname: string) => void, Record<string, string>];
export type UseStateTogetherWithPerUserValuesHook = <T>(
	rtKey: string,
	initialValue: T,
	options?: UseStateTogetherWithPerUserValuesOptions
) => [T, React.Dispatch<React.SetStateAction<T>>, Record<string, T>];
export type UseIsTogetherHook = () => boolean;
export type UseChatHook = (rtKey: string) => {
	messages: ChatMessage[];
	sendMessage: (message: string) => void;
};

// Bundle of hooks provided by react-together
export interface ReactTogetherHooksBundle {
	useMyId: UseMyIdHook;
	useConnectedUsers: UseConnectedUsersHook;
	useNicknames: UseNicknamesHook;
	useStateTogetherWithPerUserValues: UseStateTogetherWithPerUserValuesHook;
	useIsTogether: UseIsTogetherHook;
	useChat?: UseChatHook; // Optional as per previous observation
}

// Parameters for the ReactTogether session
export interface SessionParams {
	appId: string;
	apiKey?: string;
	name?: string;
	password?: string;
	model?: object; // Changed from 'any' to 'object'
	viewData?: Record<string, unknown>;
	autoStart?: boolean;
	debug?: boolean;
}

// Props for the ReactTogether component
export interface ReactTogetherProps extends React.PropsWithChildren {
	sessionParams: SessionParams;
	sessionIgnoresUrl?: boolean;
	userId?: string;
	deriveNickname?: (userId: string) => string;
	rememberUsers?: boolean;
}
