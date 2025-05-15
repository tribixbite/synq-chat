import { DefaultConfig, Env } from "@shared/constants";
import type { TConfig } from "@shared/types";

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : DefaultConfig.PORT;

const HOST = process.env.HOST ?? DefaultConfig.HOST;

const IS_PROD = process.env.NODE_ENV === Env.Production;

export const Config: TConfig = { PORT, HOST, IS_PROD };

export const isCustomHost = HOST !== DefaultConfig.HOST;
