module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // Remove console statements in production
    process.env.NODE_ENV === 'production' && [
      'transform-remove-console',
      { exclude: ['error', 'warn'] }
    ]
  ].filter(Boolean)
}; 