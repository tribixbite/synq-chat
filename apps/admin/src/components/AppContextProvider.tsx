import { AppContext } from "@/client/contexts/app";
import { useApi } from "@/client/hooks/useApi";
import { usePersistedState } from "@/client/hooks/usePersistedState";
import type { TAppContext } from "@shared/types";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export const AppContextProvider = ({ children }: PropsWithChildren) => {
	const [count, setCount] = usePersistedState(0, "count");

	const { helloHttp } = useApi();

	// const { data: messageSocket } = helloSocket("hello from client!");
	// useEffect(() => {
	// 	if (messageSocket) console.log(`socket: ${messageSocket.message}`);
	// }, [messageSocket]);

	const { data: messageHttp } = helloHttp();
	useEffect(() => {
		if (messageHttp) console.log(`http: ${messageHttp.message}`);
	}, [messageHttp]);

	return (
		<AppContext.Provider
			value={{
				count,
				setCount
			}}
		>
			{children}
		</AppContext.Provider>
	);
};
