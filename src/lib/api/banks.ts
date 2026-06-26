import { apiClient } from "./client";

/** Bank list + account verification, proxied by erp-api to treasury S2S Paystack — one source of
 *  truth so employee bank accounts are verified before saving (accurate payroll payouts). */

export interface BankOption {
  code: string;
  name: string;
}

export const banksApi = {
  list: (country = "kenya") =>
    apiClient.get<Record<string, unknown>>(`/hrm/banks/${country}`),
  resolve: (accountNumber: string, bankCode: string) =>
    apiClient.get<Record<string, unknown>>(`/hrm/banks/resolve`, {
      account_number: accountNumber,
      bank_code: bankCode,
    }),
};
