module.exports = {
  expo: {
    name: "Nexus Mobile",
    slug: "nexus-mobile",
    scheme: "nexus",
    version: "1.0.2",
    sdkVersion: "53.0.0",
    jsEngine: "hermes",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    platforms: [
      "ios"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.nexus.ai",
      buildNumber: "3",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          "plaid",
          "citi", 
          "chase",
          "bankofamerica",
          "wellsfargo"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "app.nexus.ai"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "afb698fc-87f4-4584-9e1b-d113093787b9"
      },
      router: {
        origin: false
      },
      "expo-router": {
        appRoot: "./app"
      }
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          ios: {
            infoPlist: {
              LSApplicationQueriesSchemes: [
                "plaid",
                "citi",
                "chase", 
                "bankofamerica",
                "wellsfargo"
              ]
            }
          }
        }
      ]
    ]
  }
};