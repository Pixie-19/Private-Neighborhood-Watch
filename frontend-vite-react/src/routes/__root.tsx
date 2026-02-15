import { createRootRoute, Outlet } from '@tanstack/react-router';
import * as pino from "pino";
import { ThemeProvider } from "@/components/theme-provider";
import { MidnightMeshProvider } from "@/modules/midnight/wallet-widget/contexts/wallet";
import { NeighbourAppProvider } from "@/modules/midnight/neighbour-sdk/contexts";
import { MainLayout } from "@/layouts/layout";

export const logger = pino.pino({
  level: "trace",
});

// Deployed neighbour (incident report) contract address
const contractAddress = import.meta.env.VITE_NEIGHBOUR_CONTRACT_ADDRESS!;

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <MidnightMeshProvider logger={logger}>
        <NeighbourAppProvider logger={logger} contractAddress={contractAddress}>
          <MainLayout>
            <Outlet />
          </MainLayout>
        </NeighbourAppProvider>
      </MidnightMeshProvider>
    </ThemeProvider>
  );
}
