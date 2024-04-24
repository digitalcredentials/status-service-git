import { createStatusManager } from '@digitalcredentials/credential-status-manager-git';
import { getConfig } from './config.js';

const {
  credStatusService,
  credStatusRepoName,
  credStatusRepoId,
  credStatusMetaRepoName,
  credStatusMetaRepoId,
  credStatusOwnerAccountName,
  credStatusAccessToken,
  credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

async function createGitHubStatusManager() {
  return createStatusManager({
    gitService: credStatusService,
    repoName: credStatusRepoName,
    metaRepoName: credStatusMetaRepoName,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    // This is the already the default value,
    // but setting here to be explicit
    signStatusCredential: true,
    // This is the already the default value,
    // but setting here to be explicit
    signUserCredential: false
  });
}

async function createGitLabStatusManager() {
  return createStatusManager({
    gitService: credStatusService,
    repoName: credStatusRepoName,
    repoId: credStatusRepoId,
    metaRepoName: credStatusMetaRepoName,
    metaRepoId: credStatusMetaRepoId,
    ownerAccountName: credStatusOwnerAccountName,
    repoAccessToken: credStatusAccessToken,
    metaRepoAccessToken: credStatusAccessToken,
    didMethod: 'key',
    didSeed: credStatusDidSeed,
    // This is the already the default value,
    // but setting here to be explicit
    signStatusCredential: true,
    // This is the already the default value,
    // but setting here to be explicit
    signUserCredential: false
  });
}

/* we allow passing in a status manager, for testing */
async function initializeStatusManager(statusManager) {
  if (statusManager) {
    STATUS_LIST_MANAGER = statusManager;
    return;
  } else if (STATUS_LIST_MANAGER) {
    return;
  }

  switch (credStatusService) {
    case 'github':
      STATUS_LIST_MANAGER = await createGitHubStatusManager();
      break;
    case 'gitlab':
      STATUS_LIST_MANAGER = await createGitLabStatusManager();
      break;
    default:
      throw new Error(`Encountered unsupported credential status service: ${credStatusService}`);
  }
}

async function getStatusManager() {
  await initializeStatusManager();
  return STATUS_LIST_MANAGER;
}

async function allocateSupportedStatuses(verifiableCredential) {
  const statusManager = await getStatusManager();
  const result = verifiableCredential.credentialStatus ?
    verifiableCredential :
    await statusManager.allocateSupportedStatuses(verifiableCredential);
  return result;
}

async function updateStatus(credentialId, credentialStatus) {
  const statusManager = await getStatusManager();
  try {
    switch (credentialStatus) {
      case 'revoked':
        await statusManager.revokeCredential(credentialId);
        return { code: 200, message: 'Credential successfully revoked.' };
      case 'suspended':
        await statusManager.suspendCredential(credentialId);
        return { code: 200, message: 'Credential successfully suspended.' };
      case 'unsuspended':
        await statusManager.unsuspendCredential(credentialId);
        return { code: 200, message: 'Credential successfully unsuspended.' };
      default:
        return { code: 400, message: `Unsupported credential status: "${credentialStatus}"` };
    }
  } catch (error) {
    return {
      code: error.code ?? 500,
      message: error.message ??
        `Unable to apply status "${credentialStatus}" to credential with ID "${credentialId}".`
    };
  }
}

async function getCredentialInfo(credentialId) {
  const statusManager = await getStatusManager();
  return statusManager.getCredentialInfo(credentialId);
}

async function getStatusCredential(statusCredentialId) {
  const statusManager = await getStatusManager();
  return statusManager.getStatusCredential(statusCredentialId);
}

export default {
  initializeStatusManager,
  getStatusManager,
  allocateSupportedStatuses,
  updateStatus,
  getCredentialInfo,
  getStatusCredential
};
