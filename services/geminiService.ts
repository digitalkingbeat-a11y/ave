import { GoogleGenAI } from "@google/genai";

// Fix: Initialize the GoogleGenAI client to interact with the Gemini API.
// The API key is sourced from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Calls the Gemini API to get an explanation for a given Solidity smart contract.
 * @param code The Solidity code of the contract.
 * @param contractName The name of the contract.
 * @returns A promise that resolves to a Markdown string with the explanation.
 */
export async function explainSolidityCode(code: string, contractName: string): Promise<string> {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
        You are an expert Solidity developer and blockchain security auditor.
        Explain the following Solidity smart contract named "${contractName}" in a clear, concise, and easy-to-understand way for someone who is new to smart contracts.
        
        Structure your explanation with the following sections in Markdown format:

        ### 1. Contract Purpose
        *   What is the main goal of this contract?

        ### 2. How It Works: Step-by-Step
        *   Describe the flow of the flash loan and arbitrage logic within the \`executeOperation\` function.

        ### 3. Included Security Features
        *   What security mechanisms are already implemented (e.g., reentrancy guard, owner-only access)?

        ### 4. Potential Security Pitfalls & Risks
        *   What are the most common security vulnerabilities and risks with this type of arbitrage contract? 
        *   Specifically address issues like slippage, front-running, transaction ordering, and DEX liquidity risks.

        ### 5. Gas Optimization Opportunities
        *   Are there any areas in this code where gas consumption could be reduced? Provide specific suggestions if you find any.

        ### 6. How to Use This Contract
        *   Explain how a user would deploy and interact with this contract to initiate an arbitrage trade.

        ---

        Here is the contract code:
        \`\`\`solidity
        ${code}
        \`\`\`
    `;

    try {
        // Fix: Use ai.models.generateContent to send the prompt to the Gemini model.
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        // Fix: Extract the generated text using the recommended 'response.text' property.
        const explanation = response.text;
        
        if (!explanation) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`Request was blocked for explanation due to ${response.promptFeedback.blockReason}.`);
            }
            if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
                 throw new Error(`Explanation generation stopped for reason: ${response.candidates[0].finishReason}.`);
            }
            throw new Error('The API returned an empty response for code explanation.');
        }

        return explanation;
    } catch (error) {
        console.error(`[Gemini Service] Error explaining code with model '${model}':`, error);
        if (error instanceof Error) {
            throw new Error(`Failed to get explanation from Gemini: ${error.message}`);
        }
        throw new Error('An unknown error occurred while communicating with the Gemini API for code explanation.');
    }
}