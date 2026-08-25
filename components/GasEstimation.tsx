import React from 'react';
import { GasPrices, Network } from '../types';
import { GasIcon, InfoIcon } from './Icons';

interface GasEstimationProps {
    gasPrices: GasPrices | null;
    network: Network;
}

const DEPLOYMENT_GAS_ESTIMATE = 3000000;
const EXECUTION_GAS_ESTIMATE = 800000;

export const GasEstimation: React.FC<GasEstimationProps> = ({ gasPrices, network }) => {
    if (!gasPrices) return null;

    const calculateCost = (gasLimit: number) => {
        const ethCost = (gasLimit * gasPrices.average) / 1000000000;
        const usdCost = gasPrices.ethPrice ? ethCost * gasPrices.ethPrice : null;
        return { ethCost, usdCost };
    };

    const deployment = calculateCost(DEPLOYMENT_GAS_ESTIMATE);
    const execution = calculateCost(EXECUTION_GAS_ESTIMATE);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                    <GasIcon className="mr-2 text-cyan-400" />
                    Gas Fee Estimates
                </h3>
                <div className="text-xs text-gray-400 flex items-center">
                    <InfoIcon className="w-3 h-3 mr-1" />
                    Based on {network.name}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-semibold">Contract Deployment</p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-white">{deployment.ethCost.toFixed(6)} ETH</span>
                        {deployment.usdCost !== null && (
                            <span className="text-sm text-cyan-400 font-medium">${deployment.usdCost.toFixed(2)}</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">~3,000,000 gas units</p>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1 uppercase tracking-wider font-semibold">Flash Loan Execution</p>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-white">{execution.ethCost.toFixed(6)} ETH</span>
                        {execution.usdCost !== null && (
                            <span className="text-sm text-cyan-400 font-medium">${execution.usdCost.toFixed(2)}</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">~800,000 gas units per trade</p>
                </div>
            </div>

            <div className="text-[10px] text-gray-500 bg-gray-900/30 p-2 rounded border border-gray-800/50">
                * Estimates are approximate and depend on contract complexity and network congestion. 
                Arbitrum gas fees include L1 settlement costs which may vary.
            </div>
        </div>
    );
};
