import { Neighbour } from '@eddalabs/counter-contract';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

// The neighbour contract has no private state
export type NeighbourPrivateState = undefined;

export type NeighbourCircuits = ImpureCircuitId<Neighbour.Contract<NeighbourPrivateState>>;

export const NeighbourPrivateStateId = 'neighbourPrivateState';

export type NeighbourProviders = MidnightProviders<NeighbourCircuits, typeof NeighbourPrivateStateId, NeighbourPrivateState>;

export type NeighbourContract = Neighbour.Contract<NeighbourPrivateState>;

export type DeployedNeighbourContract = DeployedContract<NeighbourContract> | FoundContract<NeighbourContract>;

export type UserAction = {
  submitReport: string | undefined;
  verifyReport: string | undefined;
};

export type DerivedState = {
  readonly totalReports: Neighbour.Ledger['totalReports'];
  readonly turns: UserAction;
};

export const emptyState: DerivedState = {
  totalReports: 0n,
  turns: { submitReport: undefined, verifyReport: undefined },
};
