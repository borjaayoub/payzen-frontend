export interface ContractType {
  id: number;
  contractTypeName: string;
  companyId: number;
  companyName?: string;
  createdAt: string;
}

export interface ContractTypeCreateDto {
  ContractTypeName: string;
  CompanyId: number;
}

export interface ContractTypeUpdateDto {
  ContractTypeName: string;
}
