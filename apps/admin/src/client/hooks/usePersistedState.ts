import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

import { storage } from "@shared/helpers/browser";

type UsePersistedState = <T>(key: string, defaultValue: T) => [T, Dispatch<SetStateAction<T>>];

const usePersistedState: UsePersistedState = <T>(key: string, defaultValue: T) => {
	const [value, setValue] = useState(() => {
		const savedValue = storage.local.getItem<T>(key);
		return savedValue ?? defaultValue;
	});

	useEffect(() => {
		storage.local.setItem(key, value);
	}, [key, value]);

	return [value, setValue];
};

export default usePersistedState;
