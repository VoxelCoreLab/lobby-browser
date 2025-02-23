import dotenv from 'dotenv';

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * Define the available environment variables and their types.
 * Extend this interface with additional configuration keys as needed.
 */
interface ConfigVars {
  PORT: number;
  DB_URL: string;
}

/**
 * For each key in ConfigVars, define a converter function that
 * converts the raw string from process.env into the desired type.
 */
const converters: {
  [K in keyof ConfigVars]: (raw: string) => ConfigVars[K];
} = {
  PORT: (raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num)) {
      throw new Error(`Invalid number for PORT: ${raw}`);
    }
    return num;
  },
  DB_URL: (raw: string) => raw,
};

/**
 * ConfigService provides a type-safe way to retrieve environment variables.
 */
export class ConfigService {
  /**
   * Retrieves an environment variable by key, using a converter to ensure the correct type.
   *
   * @param key - A key from the ConfigVars interface.
   * @param defaultValue - An optional default value if the variable is missing.
   * @returns The value of the environment variable, converted to the correct type.
   */
  get<K extends keyof ConfigVars>(key: K, defaultValue?: ConfigVars[K]): ConfigVars[K] {
    const raw = process.env[key];
    if (raw === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Missing environment variable: ${key}`);
    }
    return converters[key](raw);
  }
}

// Export a singleton instance for ease of use across your project
export const configService = new ConfigService();
