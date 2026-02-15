import { DerivedState } from '../api/common-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ContractControllerInterface } from '../api/contractController';
import { Observable } from 'rxjs';
import { useWallet } from '../../wallet-widget/hooks/useWallet';
import { ContractDeployment } from '../contexts';
import { useDeployedContracts } from './use-deployment';
import { useProviders } from './use-providers';

export const useContractSubscription = () => {
  const { status, connectedAPI } = useWallet();
  const providers = useProviders();
  const deploy = useDeployedContracts();

  const [neighbourDeploymentObservable, setNeighbourDeploymentObservable] =
    useState<Observable<ContractDeployment> | undefined>(undefined);

  const [contractDeployment, setContractDeployment] =
    useState<ContractDeployment>();
  const [deployedContractAPI, setDeployedContractAPI] =
    useState<ContractControllerInterface>();
  const [derivedState, setDerivedState] = useState<DerivedState>();
  const [joinError, setJoinError] = useState<string | undefined>(undefined);
  const [hasStartedJoin, setHasStartedJoin] = useState(false);
  const joinAttemptedRef = useRef(false);

  const isWalletConnected = !!(status?.status === 'connected' && connectedAPI);

  const onJoin = useCallback(async (): Promise<void> => {
    // Prevent duplicate join attempts
    if (joinAttemptedRef.current) return;
    joinAttemptedRef.current = true;
    try {
      setJoinError(undefined);
      setHasStartedJoin(true);
      setNeighbourDeploymentObservable(deploy.joinContract().observable);
    } catch (e: any) {
      joinAttemptedRef.current = false;
      setJoinError(e?.message || 'Failed to join contract');
    }
  }, [deploy, setNeighbourDeploymentObservable]);

  useEffect(() => {
    if (isWalletConnected && providers?.providers && !joinAttemptedRef.current) {
      void onJoin();
    }
  }, [onJoin, isWalletConnected, providers?.providers]);

  useEffect(() => {
    if (!neighbourDeploymentObservable) {
      return;
    }
    const subscription = neighbourDeploymentObservable.subscribe(
      setContractDeployment,
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [neighbourDeploymentObservable]);

  useEffect(() => {
    if (!contractDeployment) {
      return;
    }

    if (contractDeployment.status === 'failed') {
      setJoinError(contractDeployment.error?.message || 'Failed to join contract');
      return;
    }

    if (contractDeployment.status === 'in-progress') {
      return;
    }
    setDeployedContractAPI((prev) => prev || contractDeployment.api);
  }, [contractDeployment, setDeployedContractAPI]);

  useEffect(() => {
    if (deployedContractAPI) {
      const subscriptionDerivedState =
        deployedContractAPI.state$.subscribe(setDerivedState);
      return () => {
        subscriptionDerivedState.unsubscribe();
      };
    }
  }, [deployedContractAPI]);

  // "isJoining" is true when wallet is connected and contract is not yet ready
  // This covers: waiting for providers, join in-progress, or join started but no deployment yet
  const isJoining = isWalletConnected && !deployedContractAPI && !joinError &&
    (hasStartedJoin || contractDeployment?.status === 'in-progress');

  return {
    deployedContractAPI,
    derivedState,
    providers,
    joinError,
    isJoining,
    isWalletConnected,
  };
};
