import { type Logger } from 'pino';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import * as Rx from 'rxjs';
import {
  NeighbourPrivateStateId,
  NeighbourProviders,
  DeployedNeighbourContract,
  NeighbourPrivateState,
  emptyState,
  UserAction,
  type DerivedState,
} from './common-types';
import { Neighbour } from '@eddalabs/counter-contract';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

const neighbourCompiledContract = CompiledContract.make('neighbour', Neighbour.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(`${window.location.origin}/midnight/neighbour`),
);

export interface ContractControllerInterface {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Rx.Observable<DerivedState>;
  submitReport: (reportId: Uint8Array) => Promise<void>;
  verifyReport: (reportId: Uint8Array) => Promise<boolean>;
}

export class ContractController implements ContractControllerInterface {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Rx.Observable<DerivedState>;
  readonly turns$: Rx.Subject<UserAction>;

  private constructor(
    public readonly contractPrivateStateId: typeof NeighbourPrivateStateId,
    public readonly deployedContract: DeployedNeighbourContract,
    public readonly providers: NeighbourProviders,
    private readonly logger: Logger,
  ) {
    const combine = (_acc: DerivedState, value: DerivedState): DerivedState => {
      return {
        totalReports: value.totalReports,
        turns: value.turns,
      };
    };

    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    this.turns$ = new Rx.Subject<UserAction>();

    this.state$ = Rx.combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, { type: 'all' })
          .pipe(Rx.map((contractState) => Neighbour.ledger(contractState.data))),
        Rx.concat(
          Rx.of<UserAction>({ submitReport: undefined, verifyReport: undefined }),
          this.turns$,
        ),
      ],
      (ledgerState, userActions) => {
        const result: DerivedState = {
          totalReports: ledgerState.totalReports,
          turns: userActions,
        };
        return result;
      },
    ).pipe(
      Rx.scan(combine, emptyState),
      Rx.retry({ delay: 500 }),
    );
  }

  async submitReport(reportId: Uint8Array): Promise<void> {
    this.logger?.info('Submitting anonymous incident report');
    this.turns$.next({ submitReport: 'Submitting report...', verifyReport: undefined });

    try {
      const txData = await this.deployedContract.callTx.submitReport(reportId);
      this.logger?.trace({
        submitReport: {
          message: 'Report submitted successfully',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      this.turns$.next({ submitReport: undefined, verifyReport: undefined });
    } catch (e) {
      this.turns$.next({ submitReport: undefined, verifyReport: undefined });
      throw e;
    }
  }

  async verifyReport(reportId: Uint8Array): Promise<boolean> {
    this.logger?.info('Verifying incident report');
    this.turns$.next({ submitReport: undefined, verifyReport: 'Verifying report...' });

    try {
      const txData = await this.deployedContract.callTx.verifyReport(reportId);
      this.logger?.trace({
        verifyReport: {
          message: 'Report verification completed',
          txHash: txData.public.txHash,
          blockHeight: txData.public.blockHeight,
        },
      });
      this.turns$.next({ submitReport: undefined, verifyReport: undefined });
      // The circuit returns a boolean
      return txData.public.result ?? false;
    } catch (e) {
      this.turns$.next({ submitReport: undefined, verifyReport: undefined });
      throw e;
    }
  }

  static async deploy(
    contractPrivateStateId: typeof NeighbourPrivateStateId,
    providers: NeighbourProviders,
    logger: Logger,
  ): Promise<ContractController> {
    logger.info({
      deployContract: {
        action: 'Deploying neighbour contract',
        contractPrivateStateId,
      },
    });

    const deployedContract = await deployContract(providers, {
      compiledContract: neighbourCompiledContract,
      privateStateId: contractPrivateStateId,
      initialPrivateState: undefined,
    });

    logger.trace({
      contractDeployed: {
        action: 'Neighbour contract deployed',
        contractPrivateStateId,
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new ContractController(contractPrivateStateId, deployedContract, providers, logger);
  }

  static async join(
    contractPrivateStateId: typeof NeighbourPrivateStateId,
    providers: NeighbourProviders,
    contractAddress: ContractAddress,
    logger: Logger,
  ): Promise<ContractController> {
    logger.info({
      joinContract: {
        action: 'Joining neighbour contract',
        contractPrivateStateId,
        contractAddress,
      },
    });

    const deployedContract = await findDeployedContract(providers, {
      contractAddress,
      compiledContract: neighbourCompiledContract,
      privateStateId: contractPrivateStateId,
      initialPrivateState: undefined,
    });

    logger.trace({
      contractJoined: {
        action: 'Joined neighbour contract successfully',
        contractPrivateStateId,
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new ContractController(contractPrivateStateId, deployedContract, providers, logger);
  }
}
