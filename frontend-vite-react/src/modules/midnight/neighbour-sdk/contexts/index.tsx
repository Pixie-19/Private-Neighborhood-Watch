import { DeployedProvider } from './neighbour-deployment';
import { LocalStorageProvider } from './neighbour-localStorage';
import { Provider } from './neighbour-providers';
import { Logger } from 'pino';
import { ContractAddress } from '@midnight-ntwrk/compact-runtime';

export * from './neighbour-providers';
export * from './neighbour-localStorage';
export * from './neighbour-localStorage-class';
export * from './neighbour-deployment';
export * from './neighbour-deployment-class';

interface AppProviderProps {
  children: React.ReactNode;
  logger: Logger;
  contractAddress: ContractAddress;
}

export const NeighbourAppProvider = ({ children, logger, contractAddress }: AppProviderProps) => {
  return (
    <LocalStorageProvider logger={logger}>
      <Provider logger={logger}>
        <DeployedProvider logger={logger} contractAddress={contractAddress}>
          {children}
        </DeployedProvider>
      </Provider>
    </LocalStorageProvider>
  );
};
