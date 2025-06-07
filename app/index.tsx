import React from "react";

import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

const Home = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(manager)/(tabs)/Home" />;
  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Home;
