export const BaseCompose = (services: any) => {
  return {
    services,
    volumes: {
      node_modules: {
        driver: "local",
      },
    },
    networks: {
      allTests_network: {
        driver: "bridge",
      },
    },
  };
};
