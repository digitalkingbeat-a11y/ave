import React from 'react';
import { GasPriceTracker } from './GasPriceTracker';
import { GasPrices, Network } from '../types';

interface HeaderProps {
    onGasUpdate: (prices: GasPrices | null) => void;
    network: Network;
}

export const Header: React.FC<HeaderProps> = ({ onGasUpdate, network }) => {
    return (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 lg:px-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Flash Loan <span className="text-cyan-400">Arbitrage Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-gray-400">Visually build and understand Aave V3 flash loan arbitrage contracts with Gemini.</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${network.isTestnet ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/50' : 'bg-green-900/40 text-green-400 border border-green-700/50'}`}>
                            {network.name}
                        </span>
                    </div>
                </div>
                <div className="hidden lg:block">
                     <GasPriceTracker network={network} onUpdate={onGasUpdate} />
                </div>
            </div>
        </header>
    );
};