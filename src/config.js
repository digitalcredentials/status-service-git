
let CONFIG;
const defaultPort = 4008;
const defaultConsoleLogLevel = 'silly';
const defaultLogLevel = 'silly';

export function setConfig() {
  CONFIG = parseConfig();
}

function getBooleanValue(value, defaultValue=true) {
  value = value?.toLocaleLowerCase();
  if (
    value === 'true' ||
    value === 't' ||
    value === 'yes' ||
    value === 'y' ||
    value === '1'
  ) {
    return true;
  } else if (
    value === 'false' ||
    value === 'f' ||
    value === 'no' ||
    value === 'n' ||
    value === '0'
  ) {
    return false;
  }
  return defaultValue;
}

function getGeneralEnvs(env) {
  return {
    port: env.PORT ? parseInt(env.PORT) : defaultPort,
    credStatusService: env.CRED_STATUS_SERVICE,
    credStatusDidSeed: env.CRED_STATUS_DID_SEED,
    consoleLogLevel: env.CONSOLE_LOG_LEVEL?.toLocaleLowerCase() ?? defaultConsoleLogLevel,
    logLevel: env.LOG_LEVEL?.toLocaleLowerCase() ?? defaultLogLevel,
    enableAccessLogging: getBooleanValue(env.ENABLE_ACCESS_LOGGING),
    enableHttpsForDev: getBooleanValue(env.ENABLE_HTTPS_FOR_DEV),
    errorLogFile: env.ERROR_LOG_FILE,
    allLogFile: env.ALL_LOG_FILE
  };
}

function getGitHubEnvs(env) {
  return {
    credStatusRepoAccessToken: env.CRED_STATUS_REPO_ACCESS_TOKEN,
    credStatusMetaRepoAccessToken: env.CRED_STATUS_META_REPO_ACCESS_TOKEN,
    credStatusRepoName: env.CRED_STATUS_REPO_NAME,
    credStatusMetaRepoName: env.CRED_STATUS_META_REPO_NAME,
    credStatusOwnerAccountName: env.CRED_STATUS_OWNER_ACCOUNT_NAME
  };
}

function getGitLabEnvs(env) {
  const gitHubEnvs = getGitHubEnvs(env);
  return {
    ...gitHubEnvs,
    credStatusRepoId: env.CRED_STATUS_REPO_ID,
    credStatusMetaRepoId: env.CRED_STATUS_META_REPO_ID
  };
}

function parseConfig() {
  const env = process.env;
  let serviceSpecificEnvs;
  switch (env.CRED_STATUS_SERVICE) {
    case 'github':
      serviceSpecificEnvs = getGitHubEnvs(env);
      break;
    case 'gitlab':
      serviceSpecificEnvs = getGitLabEnvs(env);
      break;
    default:
      throw new Error(`Encountered unsupported credential status service: ${env.CRED_STATUS_SERVICE}`);
  }
  const generalEnvs = getGeneralEnvs(env);
  const config = Object.freeze({
    ...generalEnvs,
    ...serviceSpecificEnvs
  });
  return config;
}

export function getConfig() {
  if (!CONFIG) {
    setConfig();
  }
  return CONFIG;
}

export function resetConfig() {
  CONFIG = null;
}
