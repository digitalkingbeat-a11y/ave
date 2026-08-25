import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { GasIcon, WarningIcon } from './Icons';
import { GasPrices, Network } from '../types';

interface GasPriceTrackerProps {
    network: Network;
    onUpdate: (prices: GasPrices | null) => void;
}

export const GasPriceTracker: React.FC<GasPriceTrackerProps> = ({ network, onUpdate }) => {
    const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);

        const fetchData = async () => {
            try {
                // Fetch Gas Price
                const feeData = await provider.getFeeData();
                const baseGasPrice = feeData.gasPrice ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 0;
                
                // Fetch ETH Price (from CoinGecko)
                let ethPrice = 0;
                try {
                    const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                    const priceData = await priceRes.json();
                    ethPrice = priceData.ethereum.usd;
                } catch (e) {
                    console.error("Failed to fetch ETH price", e);
                    // Fallback or just keep it 0
                }

                if (isMounted) {
                    const newPrices: GasPrices = {
                        slow: Math.max(0.1, baseGasPrice * 0.8),
                        average: Math.max(0.1, baseGasPrice),
                        fast: Math.max(0.1, baseGasPrice * 1.2),
                        ethPrice: ethPrice
                    };
                    setGasPrices(newPrices);
                    onUpdate(newPrices);
                    setError(null);
                    setIsLoading(false);
                }
            } catch (e) {
                if (isMounted) {
                    const err = e instanceof Error ? e : new Error('Failed to fetch network data');
                    setError(err.message);
                    onUpdate(null);
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000); // Update every 15 seconds

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [network, onUpdate]);

    return (
        <div className="flex items-center space-x-4 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2">
            <GasIcon className="text-cyan-400" />
            {error && (
                <div className="flex items-center text-red-400 text-xs">
                    <WarningIcon className="mr-2" />
                    <span>Error fetching gas</span>
                </div>
            )}
            {isLoading && !gasPrices && (
                <div className="text-xs text-gray-400 animate-pulse">Loading gas...</div>
            )}
            {gasPrices && !error && (
                <div className="flex items-center space-x-4 text-xs text-gray-300">
                    <div>
                        <span className="text-gray-400">Avg: </span>
                        <span className="font-semibold text-white">{gasPrices.average.toFixed(2)}</span> Gwei
                    </div>
                    {gasPrices.ethPrice && (
                        <div className="border-l border-gray-700 pl-4">
                            <span className="text-gray-400">ETH: </span>
                            <span className="font-semibold text-white">${gasPrices.ethPrice.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
