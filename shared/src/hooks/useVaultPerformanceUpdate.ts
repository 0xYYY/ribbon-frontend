import { BigNumber } from "@ethersproject/bignumber";
import { useContext } from "react";

import {
  Chains,
  CHAINS_TO_ID,
  isSolanaVault,
  VaultAddressMap,
  VaultList,
  VaultOptions,
  VaultVersion,
  VaultVersionList,
} from "../constants/constants";
import { VaultPriceHistoriesData } from "../models/vault";
import { isEVMChain } from "../utils/chains";
import { SubgraphDataContext } from "./subgraphDataContext";

const getVaultPriceHistoryKey = (vault: VaultOptions) =>
  `vaultPriceHistory_${vault.replace(/-/g, "")}`;

export const vaultPriceHistoryGraphql = (
  version: VaultVersion,
  chain: Chains
) => {
  return VaultList.reduce((acc, vault) => {
    let vaultAddress = VaultAddressMap[vault][version];

    if (
      !isSolanaVault(vault) &&
      (!vaultAddress || VaultAddressMap[vault].chainId !== CHAINS_TO_ID[chain])
    ) {
      return acc;
    }

    if (isEVMChain(chain)) {
      vaultAddress = vaultAddress?.toLowerCase();
    }

    return (
      acc +
      `
        ${getVaultPriceHistoryKey(vault)}: vaultPerformanceUpdates(
          ${
            isSolanaVault(vault)
              ? `where: { vaultId: {_in: ["${vaultAddress}"]} },`
              : `where: { vault_in: ["${vaultAddress}"] },`
          }
          orderBy: timestamp,
          orderDirection: desc,
          first: 1000
        ) {
          pricePerShare
          timestamp
          ${version !== "v1" ? "round" : ""}
        }
      `
    );
  }, "");
};

export const resolveVaultPriceHistorySubgraphResponse = (responses: {
  [version in VaultVersion]: any | undefined;
}): VaultPriceHistoriesData =>
  Object.fromEntries(
    VaultVersionList.map((version) => [
      version,
      Object.fromEntries(
        VaultList.map((vault) => {
          const priceHistory =
            responses[version][getVaultPriceHistoryKey(vault)];

          return [
            vault,
            priceHistory
              ? priceHistory
                  .map(
                    (history: {
                      pricePerShare: string;
                      round: number;
                      timestamp: number;
                    }) => ({
                      ...history,
                      pricePerShare: BigNumber.from(history.pricePerShare),
                    })
                  )
                  .reverse()
              : [],
          ];
        })
      ),
    ])
  ) as VaultPriceHistoriesData;

const useVaultPriceHistory = (
  vaultOption: VaultOptions,
  vaultVersion: VaultVersion
) => {
  const contextData = useContext(SubgraphDataContext);

  return {
    priceHistory:
      contextData.vaultSubgraphData.vaultPriceHistory[vaultVersion][
        vaultOption
      ],
    loading: contextData.vaultSubgraphData.loading,
  };
};

export const useVaultsPriceHistory = () => {
  const contextData = useContext(SubgraphDataContext);
  return {
    data: contextData.vaultSubgraphData.vaultPriceHistory,
    loading: contextData.vaultSubgraphData.loading,
  };
};

export default useVaultPriceHistory;
