module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Suprimir warnings do source-map-loader para react-datepicker
      webpackConfig.ignoreWarnings = [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('react-datepicker') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ];
      return webpackConfig;
    },
  },
}; 