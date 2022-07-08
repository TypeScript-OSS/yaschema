let globalLogger: Logger = {};

export interface Logger {
  debug?: (message?: any, ...optionalParams: any[]) => void;
  error?: (message?: any, ...optionalParams: any[]) => void;
  info?: (message?: any, ...optionalParams: any[]) => void;
  log?: (message?: any, ...optionalParams: any[]) => void;
  warn?: (message?: any, ...optionalParams: any[]) => void;
}

/** Gets the logger registered using `setLogger` */
export const getLogger = () => globalLogger;

/** Sets the logger to be used.  It's not recommended to set a logger in client-side production environments */
export const setLogger = (logger: Logger) => {
  globalLogger = logger;
};
