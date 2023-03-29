module.exports = {
    resolve: { 
        fallback: { 'process/browser': require.resolve('process/browser'), } 
    },
};