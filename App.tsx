import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeBlock } from './components/CodeBlock';
import { RecentTransactions } from './components/RecentTransactions';
import { GasEstimation } from './components/GasEstimation';
import { SparklesIcon, WarningIcon } from './components/Icons';
import { Token, DexInfo, GasPrices, Network } from './types';
import { SUPPORTED_TOKENS, SUPPORTED_DEXES, DEFAULT_CONTRACT_CODE, NETWORKS } from './constants';
import { generateArbitrageContract } from './services/contractGenerator';
import { explainSolidityCode } from './services/geminiService';

const App: React.FC = () => {
    const [network, setNetwork] = React.useState<Network>(NETWORKS[0]);
    const [contractName, setContractName] = useState<string>('FlashLoanArbitrage');
    const [loanToken, setLoanToken] = useState<Token>(SUPPORTED_TOKENS[NETWORKS[0].chainId][0]);
    const [collateralToken, setCollateralToken] = useState<Token>(SUPPORTED_TOKENS[NETWORKS[0].chainId][1]);
    const [dex1, setDex1] = useState<DexInfo>(SUPPORTED_DEXES[0]);
    const [dex2, setDex2] = useState<DexInfo>(SUPPORTED_DEXES[1]);
    const [loanAmount, setLoanAmount] = useState<number>(1000);
    const [slippageDex1, setSlippageDex1] = useState<number>(0.5);
    const [slippageDex2, setSlippageDex2] = useState<number>(0.5);

    const [generatedCode, setGeneratedCode] = useState<string>(DEFAULT_CONTRACT_CODE);
    const [codeExplanation, setCodeExplanation] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExplaining, setIsExplaining] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [explanationError, setExplanationError] = useState<string | null>(null);
    const [remixLink, setRemixLink] = useState<string>('');

    const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);

    // Update tokens when network changes
    React.useEffect(() => {
        const networkTokens = SUPPORTED_TOKENS[network.chainId];
        if (networkTokens) {
            setLoanToken(networkTokens[0]);
            setCollateralToken(networkTokens[1]);
        }
    }, [network]);

    const handleGenerateContract = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setExplanationError(null);
        setCodeExplanation('');
        setGeneratedCode(DEFAULT_CONTRACT_CODE);
        setRemixLink('');

        if (loanToken.symbol === collateralToken.symbol) {
            setError("Loan token and collateral token cannot be the same.");
            setIsLoading(false);
            return;
        }

        if (dex1.name === dex2.name) {
            setError("DEX 1 and DEX 2 cannot be the same.");
            setIsLoading(false);
            return;
        }

        try {
            const contractCode = await generateArbitrageContract(contractName, network, loanToken, collateralToken, loanAmount, dex1, dex2, slippageDex1, slippageDex2);
            setGeneratedCode(contractCode);

            const remixPayload = {
                sources: {
                    [`${contractName}.sol`]: {
                        content: contractCode,
                    },
                },
            };
            const jsonPayload = JSON.stringify(remixPayload);
            const base64Payload = btoa(jsonPayload);
            const url = `https://remix.ethereum.org/#source=data:application/json;base64,${base64Payload}`;
            setRemixLink(url);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('An unknown error occurred');
            console.error('Failure during contract generation:', error);
            setError(`Failed to generate smart contract. ${error.message}`);
            setGeneratedCode('// Error generating contract. Please check the console and try again.');
        } finally {
            setIsLoading(false);
        }
    }, [contractName, loanToken, collateralToken, loanAmount, dex1, dex2, slippageDex1, slippageDex2]);

    const handleExplainCode = useCallback(async () => {
        if (!generatedCode || generatedCode === DEFAULT_CONTRACT_CODE || generatedCode.startsWith('// Error')) {
            setExplanationError("Generate a valid contract before requesting an explanation.");
            return;
        }
        
        setIsExplaining(true);
        setExplanationError(null);
        setCodeExplanation('');

        try {
            const explanation = await explainSolidityCode(generatedCode, contractName);
            setCodeExplanation(explanation);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('An unknown error occurred');
            console.error('Failure during code explanation:', error);
            setExplanationError(`Failed to get explanation. ${error.message}`);
            setCodeExplanation('// Could not retrieve explanation. Please try again.');
        } finally {
            setIsExplaining(false);
        }
    }, [generatedCode, contractName]);

    const OptionSelector = ({ label, value, onChange, options, valueKey, displayKey }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: any[], valueKey: string, displayKey: string }) => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <select
                value={value}
                onChange={onChange}
                className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
            >
                {options.map((option, index) => (
                    <option key={index} value={option[valueKey]}>{option[displayKey]}</option>
                ))}
            </select>
        </div>
    );
    
    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <Header onGasUpdate={setGasPrices} network={network} />
            <main className="container mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
                            <h2 className="text-2xl font-bold text-white mb-4">Arbitrage Setup</h2>
                            
                            <div className="space-y-4">
                                <OptionSelector
                                    label="Network"
                                    value={network.name}
                                    onChange={(e) => setNetwork(NETWORKS.find(n => n.name === e.target.value)!)}
                                    options={NETWORKS}
                                    valueKey="name"
                                    displayKey="name"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Contract Name</label>
                                    <input
                                        type="text"
                                        value={contractName}
                                        onChange={(e) => setContractName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
                                        placeholder="MyArbitrageBot"
                                    />
                                </div>
                               <OptionSelector
                                    label="Loan Token"
                                    value={loanToken.symbol}
                                    onChange={(e) => setLoanToken(SUPPORTED_TOKENS[network.chainId].find(t => t.symbol === e.target.value)!)}
                                    options={SUPPORTED_TOKENS[network.chainId]}
                                    valueKey="symbol"
                                    displayKey="name"
                                />
                                <OptionSelector
                                    label="Collateral Token"
                                    value={collateralToken.symbol}
                                    onChange={(e) => setCollateralToken(SUPPORTED_TOKENS[network.chainId].find(t => t.symbol === e.target.value)!)}
                                    options={SUPPORTED_TOKENS[network.chainId]}
                                    valueKey="symbol"
                                    displayKey="name"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Loan Amount ({loanToken.symbol})</label>
                                    <input
                                        type="number"
                                        value={loanAmount}
                                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
                                    />
                                </div>
                                <OptionSelector
                                    label="DEX 1 (Sell)"
                                    value={dex1.name}
                                    onChange={(e) => setDex1(SUPPORTED_DEXES.find(d => d.name === e.target.value)!)}
                                    options={SUPPORTED_DEXES}
                                    valueKey="name"
                                    displayKey="name"
                                />
                                <OptionSelector
                                    label="DEX 2 (Buy)"
                                    value={dex2.name}
                                    onChange={(e) => setDex2(SUPPORTED_DEXES.find(d => d.name === e.target.value)!)}
                                    options={SUPPORTED_DEXES}
                                    valueKey="name"
                                    displayKey="name"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Slippage DEX 1 (%)</label>
                                        <input
                                            type="number"
                                            value={slippageDex1}
                                            onChange={(e) => setSlippageDex1(Number(e.target.value))}
                                            step="0.1"
                                            min="0"
                                            className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Slippage DEX 2 (%)</label>
                                        <input
                                            type="number"
                                            value={slippageDex2}
                                            onChange={(e) => setSlippageDex2(Number(e.target.value))}
                                            step="0.1"
                                            min="0"
                                            className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm pl-3 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateContract}
                                disabled={isLoading}
                                className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="mr-2" /> Generate Smart Contract
                                    </>
                                )}
                            </button>
                            {error && (
                                <div className="mt-4 flex items-start text-sm text-red-400 bg-red-900/20 p-3 rounded-md border border-red-700/50">
                                    <WarningIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                        <GasEstimation gasPrices={gasPrices} network={network} />
                        <RecentTransactions />
                    </div>

                    {/* Right Panel: Code and Explanation */}
                    <div className="lg:col-span-2 grid grid-rows-2 gap-8" style={{ gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
                         <CodeBlock code={generatedCode} remixLink={remixLink} contractName={contractName} />
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white">Gemini's Explanation</h3>
                                {generatedCode !== DEFAULT_CONTRACT_CODE && !generatedCode.startsWith('// Error') && !codeExplanation && !isExplaining && (
                                    <button
                                        onClick={handleExplainCode}
                                        disabled={isExplaining}
                                        className="flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <SparklesIcon className="mr-2" /> Explain Code
                                    </button>
                                )}
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {isExplaining && (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-400">Gemini is thinking...</p>
                                    </div>
                                )}
                                {!isExplaining && codeExplanation && (
                                    <pre className="text-sm whitespace-pre-wrap font-sans text-gray-300">
                                        {codeExplanation}
                                    </pre>
                                )}
                                {!isExplaining && !codeExplanation && (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-400 text-center">
                                            {generatedCode === DEFAULT_CONTRACT_CODE 
                                                ? "Generate a contract to see the explanation." 
                                                : "Click 'Explain Code' to get an explanation of the generated smart contract from Gemini."}
                                        </p>
                                    </div>
                                )}
                            </div>
                             {explanationError && (
                                <div className="mt-4 flex items-start text-sm text-red-400 bg-red-900/20 p-3 rounded-md border border-red-700/50">
                                    <WarningIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{explanationError}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;