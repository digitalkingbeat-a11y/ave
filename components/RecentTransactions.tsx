import React from 'react';

export const RecentTransactions: React.FC = () => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg h-full">
            <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
            <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-md">
                <p className="text-gray-400">Transaction history will appear here.</p>
            </div>
        </div>
    );
};
