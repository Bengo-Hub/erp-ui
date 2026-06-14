"use client";

import { makeResourceHooks } from "@/hooks/use-crud-resource";
import { contractsApi, type Contract } from "@/lib/api/contracts";

const contracts = makeResourceHooks<Contract>("contracts", contractsApi, "Contract");

export const useContracts = contracts.useList;
export const useContract = contracts.useDetail;
export const useSaveContract = contracts.useSave;
export const useDeleteContract = contracts.useRemove;
