import { treaty } from "@elysiajs/eden";
import { useQuery } from "@tanstack/react-query";

// import { socket } from "@/client/helpers/socket";
import type { App as ServerAppType } from "@server/index";
// import { SocketEvent } from "@shared/constants";

const client = treaty<ServerAppType>(window.location.origin);

export const useApi = () => {
	// const helloSocket = (message: string) =>
	// 	useQuery({
	// 		queryKey: ["hello-socket"],
	// 		queryFn: () => socket.emitAndReceive({ event: SocketEvent.Hello, data: [message] })
	// 	});

	const helloHttp = (name?: string) =>
		useQuery({
			queryKey: ["hello-http", name],
			queryFn: async () => {
				const { data, error } = await client.api.hello.get({
					query: { name }
				});
				if (error) throw error.value;
				return data;
			}
		});

	return { helloHttp };
};
