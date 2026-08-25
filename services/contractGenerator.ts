import { GoogleGenAI } from "@google/genai";
import { Token, DexInfo, Network } from "../types";

// Fix: Initialize the GoogleGenAI client according to the SDK guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a Solidity smart contract for flash loan arbitrage using the Gemini API.
 * @param contractName The desired name for the smart contract.
 * @param network The target network for deployment.
 * @param loanToken The token to borrow in the flash loan.
 * @param collateralToken The token to trade with.
 * @param loanAmount The amount of the loanToken to borrow.
 * @param dex1 The first decentralized exchange for the arbitrage.
 * @param dex2 The second decentralized exchange for the arbitrage.
 * @param slippageDex1 The slippage tolerance for the first swap in percentage.
 * @param slippageDex2 The slippage tolerance for the second swap in percentage.
 * @returns A promise that resolves to the generated Solidity code as a string.
 */
export async function generateArbitrageContract(
    contractName: string,
    network: Network,
    loanToken: Token,
    collateralToken: Token,
    loanAmount: number,
    dex1: DexInfo,
    dex2: DexInfo,
    slippageDex1: number,
    slippageDex2: number
): Promise<string> {
    // Fix: Use gemini-2.5-pro for better code generation capabilities.
    const model = 'gemini-2.5-pro';

    const prompt = `
        You are an expert Solidity developer specializing in DeFi and arbitrage strategies.
        Your task is to generate a complete, secure, and functional Solidity smart contract for a flash loan arbitrage on the ${network.name} network.

        **Contract Requirements:**

        1.  **Framework:** Use Foundry.
        2.  **Solidity Version:** \`pragma solidity ^0.8.10;\`
        3.  **Flash Loan Provider:** Aave V3 on ${network.name}. The PoolAddressesProvider is at \`${network.aavePoolAddressesProvider}\`.
        4.  **Arbitrage Logic:**
            *   Borrow \`${loanAmount} ${loanToken.symbol}\` from Aave V3.
            *   Swap the borrowed \`${loanToken.symbol}\` for \`${collateralToken.symbol}\` on \`${dex1.name}\`.
            *   Swap the acquired \`${collateralToken.symbol}\` back to \`${loanToken.symbol}\` on \`${dex2.name}\`.
            *   Repay the flash loan to Aave V3 with the premium.
            *   If there is a profit, transfer it to the contract owner.
            *   If the arbitrage is not profitable, the transaction must revert to avoid losses.
        5.  **Slippage Control:**
            *   For the first swap on \`${dex1.name}\`, calculate the minimum acceptable output amount of \`${collateralToken.symbol}\` based on a **${slippageDex1}%** slippage tolerance. The swap must revert if the actual output is lower.
            *   For the second swap on \`${dex2.name}\`, calculate the minimum acceptable output amount of \`${loanToken.symbol}\` based on a **${slippageDex2}%** slippage tolerance. This output must be enough to cover the flash loan repayment plus premium and generate a profit. The swap must revert if the actual output is lower than the minimum required to be profitable.
        6.  **Interfaces:** Include necessary interfaces for Aave V3 (\`IPool\`, \`IPoolAddressesProvider\`), ERC20 tokens, and the DEXs (\`IUniswapV3SwapRouter\`, \`ISwapRouter02\` for Sushiswap, etc.). Assume standard interfaces for Uniswap-like DEXs.
        7.  **Security:**
            *   Implement a reentrancy guard.
            *   Include an \`onlyOwner\` modifier for sensitive functions like withdrawing funds.
            *   Ensure all token approvals are handled safely.
        8.  **Constructor:** The constructor should take the addresses of the two tokens (\`${loanToken.symbol}\` and \`${collateralToken.symbol}\`) and the addresses of the two DEX routers as arguments.
        9.  **Main Function:** Create a function, for example \`executeFlashLoan(uint256 amount)\`, that the owner can call to initiate the arbitrage. This function should request the flash loan from Aave.
        10. **Callback Function:** The core arbitrage logic must be inside the \`executeOperation\` callback function as required by Aave V3.

        Provide only the complete Solidity code for the contract named \`${contractName}\`. Do not include explanations, deployment instructions, or any other text outside of the code block.
    `;

    try {
        // Fix: Use ai.models.generateContent to make the API call.
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        // Fix: Extract the generated text using the recommended 'response.text' property.
        const code = response.text;
        
        if (!code) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
                throw new Error(`Generation stopped for reason: ${response.candidates[0].finishReason}.`);
            }
            throw new Error('The API returned an empty response for contract generation.');
        }

        // Clean up the response to ensure it's just Solidity code
        const cleanedCode = code.replace(/```solidity/g, '').replace(/```/g, '').trim();

        return cleanedCode;
    } catch (error) {
        console.error(`[Contract Generator Service] Error generating contract with model '${model}':`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate contract from Gemini: ${error.message}`);
        }
        throw new Error('An unknown error occurred while communicating with the Gemini API for contract generation.');
    }
}