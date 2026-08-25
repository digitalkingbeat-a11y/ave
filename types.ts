export interface Network {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    aavePoolAddressesProvider: string;
    isTestnet: boolean;
}

export interface Token {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    logoUrl: string;
}

export interface DexInfo {
    name:string;
    logoUrl: string;
}

export interface GasPrices {
    slow: number;
    average: number;
    fast: number;
    ethPrice?: number;
}
